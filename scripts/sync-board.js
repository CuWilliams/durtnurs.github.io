#!/usr/bin/env node
/**
 * MESSAGE BOARD SYNC
 *
 * Turns approved GitHub issues into board notes.
 *
 * Pipeline:
 *   visitor submits -> Cloudflare Worker -> GitHub issue (label: board-post)
 *   -> you add the "approved" label -> this script -> assets/data/board.json
 *   -> site rebuild -> the note is on the board
 *
 * Moderation rules, expressed entirely through GitHub:
 *   label board-post + label approved + OPEN   = on the board
 *   missing "approved", or issue CLOSED        = not on the board
 *   label pinned                               = sticks to the top
 *   label style:<name>                         = forces a paper style
 *
 * The band replies by commenting on the issue. The first comment from a repo
 * owner/member/collaborator becomes the red-marker reply on the note. Prefix a
 * comment with "//" to keep it internal.
 *
 * Hand-authored notes live in assets/data/board-seed.json and are merged in
 * untouched, so the board is never empty and you can pin things without
 * opening an issue.
 *
 * Usage:
 *   GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/sync-board.js
 *
 * Runs on plain Node 18+ with no dependencies (global fetch).
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  token: process.env.GITHUB_TOKEN,
  repo: process.env.GITHUB_REPOSITORY || 'CuWilliams/durtnurs.github.io',
  apiBase: 'https://api.github.com',

  seedPath: path.join(__dirname, '..', 'assets', 'data', 'board-seed.json'),
  outputPath: path.join(__dirname, '..', 'assets', 'data', 'board.json'),

  // Labels that drive moderation
  postLabel: 'board-post',
  approvedLabel: 'approved',
  pinnedLabel: 'pinned',
  stylePrefix: 'style:',

  // Same caps the Worker and the browser enforce
  maxNameLength: 40,
  maxMessageLength: 600,
  maxReplyLength: 600,

  // Comment authors whose replies count as "the band"
  bandAssociations: ['OWNER', 'MEMBER', 'COLLABORATOR'],

  // Marker for a comment that should not appear on the board
  internalPrefix: '//',

  // Named band members a reply can be attributed to
  knownSigners: ['DeadBeat', 'SnowMan', 'The Management']
};

// =============================================================================
// TEXT SAFETY
// =============================================================================

/**
 * Strips anything that could act as markup and normalises whitespace.
 *
 * board.js escapes on render as well; this is the second layer, and it also
 * keeps the committed JSON readable and free of pasted HTML.
 *
 * @param {string} text - Raw submitted text
 * @param {number} maxLength - Hard cap after cleaning
 * @returns {string} Cleaned text
 */
function sanitize(text, maxLength) {
  if (!text) return '';

  return String(text)
    // Drop HTML tags and comments outright
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    // Normalise line endings, collapse runs of blank lines
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Collapse horizontal whitespace runs
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// =============================================================================
// ISSUE PARSING
// =============================================================================

/**
 * Reads the structured payload the Worker embeds in the issue body.
 *
 * The Worker writes an HTML comment containing JSON, so the exact submitted
 * text round-trips regardless of how GitHub renders the human-readable part
 * below it:
 *
 *   <!--board-post
 *   {"name":"Gord","message":"..."}
 *   -->
 *
 * @param {string} body - Issue body
 * @returns {Object|null} Parsed payload, or null when absent/invalid
 */
function parsePayload(body) {
  if (!body) return null;

  const match = body.match(/<!--board-post\s*([\s\S]*?)-->/);
  if (!match) return null;

  try {
    const payload = JSON.parse(match[1].trim());
    return typeof payload === 'object' && payload !== null ? payload : null;
  } catch {
    console.warn('  ⚠️  Malformed board-post payload, falling back to body text');
    return null;
  }
}

/**
 * Extracts name and message from an issue, whether it came from the Worker
 * or was opened by hand on GitHub.
 *
 * @param {Object} issue - GitHub issue object
 * @returns {{name: string, message: string}} Note content
 */
function extractContent(issue) {
  const payload = parsePayload(issue.body);

  if (payload) {
    return {
      name: sanitize(payload.name, CONFIG.maxNameLength) || 'Anonymous',
      message: sanitize(payload.message, CONFIG.maxMessageLength)
    };
  }

  // Hand-opened issue: title carries the name if it matches the Worker's
  // "Board note from X" shape, otherwise fall back to the GitHub login.
  const titleMatch = (issue.title || '').match(/^Board note from (.+)$/i);
  const name = titleMatch
    ? sanitize(titleMatch[1], CONFIG.maxNameLength)
    : sanitize(issue.user?.login, CONFIG.maxNameLength);

  // Strip the trailing "posted from" footer the fallback flow adds
  const body = (issue.body || '').split(/\n---\n/)[0];

  return {
    name: name || 'Anonymous',
    message: sanitize(body, CONFIG.maxMessageLength)
  };
}

/**
 * Picks the band's reply out of an issue's comments.
 *
 * @param {Array} comments - GitHub comment objects, oldest first
 * @returns {Object|null} Reply object, or null when there is no public reply
 */
function extractReply(comments) {
  const bandComment = comments.find(comment => {
    if (!CONFIG.bandAssociations.includes(comment.author_association)) return false;
    return !(comment.body || '').trim().startsWith(CONFIG.internalPrefix);
  });

  if (!bandComment) return null;

  let text = (bandComment.body || '').trim();
  let from = "tHE dURT nURS'";

  // A leading "DeadBeat:" attributes the reply to one of them
  const signerMatch = text.match(/^([A-Za-z' ]{2,20}):\s*/);
  if (signerMatch) {
    const candidate = signerMatch[1].trim();
    const known = CONFIG.knownSigners.find(
      signer => signer.toLowerCase() === candidate.toLowerCase()
    );
    if (known) {
      from = known;
      text = text.slice(signerMatch[0].length);
    }
  }

  const cleanText = sanitize(text, CONFIG.maxReplyLength);
  if (!cleanText) return null;

  return {
    from,
    date: bandComment.created_at.slice(0, 10),
    text: cleanText
  };
}

/**
 * Reads a forced paper style off the issue's labels.
 *
 * @param {Array} labels - GitHub label objects
 * @returns {string|undefined} Style name, or undefined to let board.js pick
 */
function extractStyle(labels) {
  const styleLabel = labels.find(label => label.name.startsWith(CONFIG.stylePrefix));
  return styleLabel ? styleLabel.name.slice(CONFIG.stylePrefix.length) : undefined;
}

// =============================================================================
// GITHUB API
// =============================================================================

/**
 * Calls the GitHub REST API.
 *
 * @param {string} endpoint - Path beginning with /
 * @returns {Promise<any>} Parsed response body
 */
async function githubRequest(endpoint) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'durtnurs-board-sync'
  };

  if (CONFIG.token) {
    headers.Authorization = `Bearer ${CONFIG.token}`;
  }

  const response = await fetch(`${CONFIG.apiBase}${endpoint}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} on ${endpoint}: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Fetches every open, approved board issue, paging through the results.
 *
 * @returns {Promise<Array>} Issue objects
 */
async function fetchApprovedIssues() {
  const labels = `${CONFIG.postLabel},${CONFIG.approvedLabel}`;
  const issues = [];
  let page = 1;

  while (true) {
    const batch = await githubRequest(
      `/repos/${CONFIG.repo}/issues?labels=${encodeURIComponent(labels)}` +
      `&state=open&per_page=100&page=${page}&sort=created&direction=desc`
    );

    if (batch.length === 0) break;

    // The issues endpoint also returns pull requests; board notes are not PRs
    issues.push(...batch.filter(issue => !issue.pull_request));

    if (batch.length < 100) break;
    page++;
  }

  return issues;
}

/**
 * Fetches the comments on one issue.
 *
 * @param {number} issueNumber - Issue number
 * @returns {Promise<Array>} Comment objects, oldest first
 */
async function fetchComments(issueNumber) {
  if (!CONFIG.token) return [];

  return githubRequest(
    `/repos/${CONFIG.repo}/issues/${issueNumber}/comments?per_page=100`
  );
}

// =============================================================================
// BUILD
// =============================================================================

/**
 * Converts one issue into a board post.
 *
 * @param {Object} issue - GitHub issue object
 * @returns {Promise<Object|null>} Post object, or null when there's nothing to show
 */
async function issueToPost(issue) {
  const { name, message } = extractContent(issue);

  if (!message) {
    console.warn(`  ⚠️  Issue #${issue.number} has no usable message, skipping`);
    return null;
  }

  const labels = issue.labels || [];
  const comments = issue.comments > 0 ? await fetchComments(issue.number) : [];
  const reply = extractReply(comments);
  const style = extractStyle(labels);

  const post = {
    id: `board-${issue.number}`,
    date: issue.created_at.slice(0, 10),
    name,
    message
  };

  if (style) post.style = style;
  if (labels.some(label => label.name === CONFIG.pinnedLabel)) post.pinned = true;
  if (reply) post.reply = reply;

  return post;
}

/**
 * Loads the hand-authored notes that are always on the board.
 *
 * @returns {Array} Seed post objects
 */
function loadSeedPosts() {
  if (!fs.existsSync(CONFIG.seedPath)) return [];

  try {
    const seed = JSON.parse(fs.readFileSync(CONFIG.seedPath, 'utf8'));
    return Array.isArray(seed.posts) ? seed.posts : [];
  } catch (error) {
    console.error(`❌ Could not read ${CONFIG.seedPath}: ${error.message}`);
    return [];
  }
}

/**
 * Sorts posts the way the board renders them: pinned first, then newest.
 *
 * @param {Array} posts - Post objects
 * @returns {Array} Sorted array
 */
function sortPosts(posts) {
  return posts.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
}

async function main() {
  console.log(`📌 Syncing board from ${CONFIG.repo}`);

  if (!CONFIG.token) {
    console.warn('⚠️  No GITHUB_TOKEN set - running unauthenticated (rate limited, no replies)');
  }

  const seedPosts = loadSeedPosts();
  console.log(`   ${seedPosts.length} hand-authored note(s) from board-seed.json`);

  const issues = await fetchApprovedIssues();
  console.log(`   ${issues.length} approved issue(s) on GitHub`);

  const issuePosts = [];
  for (const issue of issues) {
    const post = await issueToPost(issue);
    if (post) issuePosts.push(post);
  }

  const posts = sortPosts([...seedPosts, ...issuePosts]);

  const output = JSON.stringify({ posts }, null, 2) + '\n';
  const previous = fs.existsSync(CONFIG.outputPath)
    ? fs.readFileSync(CONFIG.outputPath, 'utf8')
    : '';

  if (output === previous) {
    console.log('✅ Board already up to date, nothing written');
    return;
  }

  fs.writeFileSync(CONFIG.outputPath, output);
  console.log(`✅ Wrote ${posts.length} note(s) to assets/data/board.json`);
}

main().catch(error => {
  console.error(`❌ Board sync failed: ${error.message}`);
  process.exit(1);
});
