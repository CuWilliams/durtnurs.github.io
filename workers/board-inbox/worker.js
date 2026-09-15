/**
 * BOARD INBOX WORKER
 *
 * Accepts a note from the board form at durtnurs.com and opens a GitHub issue
 * for it. Exists so visitors don't need a GitHub account to post - the Worker
 * holds the token, the visitor holds nothing.
 *
 * Runs on the Cloudflare Workers free tier (100,000 requests/day). The site's
 * DNS is already on Cloudflare, so this adds no new account and no cost.
 *
 * Required secret:
 *   BOARD_GITHUB_TOKEN - fine-grained PAT, "Issues: read and write" on the
 *                        site repo only, nothing else.
 *
 * Optional:
 *   NTFY_TOPIC         - ntfy.sh topic, enables a push notification to the
 *                        phone the moment a note arrives. The topic name is
 *                        the only access control, so treat it as a secret.
 *   TURNSTILE_SECRET   - enables Cloudflare Turnstile verification (free)
 *   BOARD_KV           - KV namespace binding, enables per-IP rate limiting
 *
 * See README.md in this folder for deployment.
 */

const CONFIG = {
  repo: 'CuWilliams/durtnurs.github.io',

  // Only these origins may post. Anything else gets no CORS headers.
  allowedOrigins: [
    'https://durtnurs.com',
    'https://www.durtnurs.com'
  ],

  // Must match BOARD_CONFIG in assets/js/board.js and CONFIG in scripts/sync-board.js
  maxNameLength: 40,
  maxMessageLength: 600,

  label: 'board-post',

  // Per-IP limits, only enforced when a BOARD_KV namespace is bound
  rateLimit: {
    maxPosts: 3,
    windowSeconds: 3600
  }
};

// =============================================================================
// CORS
// =============================================================================

/**
 * Builds CORS headers for an allowed origin.
 *
 * @param {string|null} origin - Request Origin header
 * @returns {Object} Headers object (empty when the origin isn't allowed)
 */
function corsHeaders(origin) {
  if (!origin || !CONFIG.allowedOrigins.includes(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * JSON response helper.
 *
 * @param {Object} body - Response body
 * @param {number} status - HTTP status
 * @param {Object} headers - Extra headers (CORS)
 * @returns {Response} Response
 */
function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Cleans submitted text. The browser and the sync script clean it too - this
 * is the layer that actually matters, since it's the only one an attacker
 * can't skip by posting to the endpoint directly.
 *
 * @param {*} value - Raw value from the request body
 * @param {number} maxLength - Hard cap
 * @returns {string} Cleaned text
 */
function clean(value, maxLength) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/**
 * Verifies a Cloudflare Turnstile token, when Turnstile is configured.
 *
 * @param {string} token - Token from the widget
 * @param {string} secret - Turnstile secret key
 * @param {string} ip - Client IP
 * @returns {Promise<boolean>} Whether the token is valid
 */
async function verifyTurnstile(token, secret, ip) {
  if (!token) return false;

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);

  const result = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: form }
  );

  const outcome = await result.json();
  return outcome.success === true;
}

/**
 * Per-IP rate limiting backed by KV. Skipped entirely when no namespace is
 * bound, so the Worker deploys and runs without one.
 *
 * @param {Object} kv - KV namespace binding, or undefined
 * @param {string} ip - Client IP
 * @returns {Promise<boolean>} True when the caller is over the limit
 */
async function isRateLimited(kv, ip) {
  if (!kv || !ip) return false;

  const key = `board:${ip}`;
  const count = parseInt(await kv.get(key), 10) || 0;

  if (count >= CONFIG.rateLimit.maxPosts) return true;

  await kv.put(key, String(count + 1), {
    expirationTtl: CONFIG.rateLimit.windowSeconds
  });

  return false;
}

// =============================================================================
// GITHUB
// =============================================================================

/**
 * Opens the GitHub issue for a note.
 *
 * The body carries the exact submitted text as JSON inside an HTML comment so
 * scripts/sync-board.js can round-trip it losslessly, followed by a readable
 * rendering for whoever is moderating.
 *
 * @param {string} name - Submitter name
 * @param {string} message - Note text
 * @param {string} token - GitHub token
 * @returns {Promise<Response>} GitHub API response
 */
function createIssue(name, message, token) {
  const payload = JSON.stringify({ name, message });
  const quoted = message.split('\n').map(line => `> ${line}`).join('\n');

  const body = [
    '<!--board-post',
    payload,
    '-->',
    '',
    `**${name}** pinned this to the board:`,
    '',
    quoted,
    '',
    '---',
    '',
    'Add the `approved` label to put it up. Comment to reply in red marker.',
    'Close the issue to leave it down.'
  ].join('\n');

  return fetch(`https://api.github.com/repos/${CONFIG.repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'durtnurs-board-inbox'
    },
    body: JSON.stringify({
      title: `Board note from ${name}`,
      body,
      labels: [CONFIG.label]
    })
  });
}

// =============================================================================
// NOTIFICATION
// =============================================================================

/**
 * Sends a push notification to the ntfy.sh topic, when one is configured.
 *
 * GitHub Mobile only pushes direct mentions, assignments, review requests and
 * deployment approvals - a new issue in a watched repo doesn't reach the phone.
 * Worse, these issues are opened by our own token, so GitHub treats them as our
 * own activity and stays quiet. So the Worker pushes directly instead.
 *
 * Never throws. A failed notification must not fail the visitor's submission -
 * the note is already safely on GitHub by the time this runs.
 *
 * @param {string} topic - ntfy.sh topic name
 * @param {string} name - Submitter name
 * @param {string} message - Note text
 * @param {string|null} issueURL - Link to the created issue, when known
 * @returns {Promise<void>}
 */
async function notify(topic, name, message, issueURL) {
  if (!topic) return;

  const headers = {
    'Title': `Board note from ${name}`,
    'Tags': 'pushpin',
    'Priority': 'default'
  };

  // Tapping the notification opens the issue, ready to label
  if (issueURL) headers['Click'] = issueURL;

  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers,
      body: message.slice(0, 400)
    });
  } catch (error) {
    console.error(`ntfy failed: ${error}`);
  }
}

// =============================================================================
// HANDLER
// =============================================================================

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, cors);
    }

    // No CORS headers means the origin isn't on the list
    if (Object.keys(cors).length === 0) {
      return json({ error: 'Not allowed from here' }, 403, {});
    }

    if (!env.BOARD_GITHUB_TOKEN) {
      console.error('BOARD_GITHUB_TOKEN is not set');
      return json({ error: 'Board is not configured' }, 500, cors);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Send JSON' }, 400, cors);
    }

    // Honeypot, re-checked here in case the request skipped the page
    if (payload.website) {
      return json({ ok: true }, 200, cors);
    }

    const name = clean(payload.name, CONFIG.maxNameLength) || 'Anonymous';
    const message = clean(payload.message, CONFIG.maxMessageLength);

    if (!message) {
      return json({ error: 'Write something on it first' }, 400, cors);
    }

    // Turnstile, only when a secret is configured
    if (env.TURNSTILE_SECRET) {
      const ip = request.headers.get('CF-Connecting-IP');
      const passed = await verifyTurnstile(payload.turnstileToken, env.TURNSTILE_SECRET, ip);

      if (!passed) {
        return json({ error: 'Could not verify you are a person' }, 403, cors);
      }
    }

    const ip = request.headers.get('CF-Connecting-IP');
    if (await isRateLimited(env.BOARD_KV, ip)) {
      return json({ error: 'That is enough notes for one hour' }, 429, cors);
    }

    const response = await createIssue(name, message, env.BOARD_GITHUB_TOKEN);

    if (!response.ok) {
      // Log the detail, return none - the visitor doesn't need our API errors
      console.error(`GitHub ${response.status}: ${await response.text()}`);
      return json({ error: 'Could not pin it up' }, 502, cors);
    }

    // Pull the issue URL out so the notification can link straight to it.
    // A malformed response here must not sink a note that GitHub accepted.
    let issueURL = null;
    try {
      issueURL = (await response.json()).html_url || null;
    } catch (error) {
      console.error(`Could not read the issue URL: ${error}`);
    }

    // waitUntil: the visitor gets their confirmation without waiting on ntfy
    ctx.waitUntil(notify(env.NTFY_TOPIC, name, message, issueURL));

    return json({ ok: true }, 201, cors);
  }
};
