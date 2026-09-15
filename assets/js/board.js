/**
 * MESSAGE BOARD MODULE
 * Renders the corkboard of visitor notes and handles new submissions.
 *
 * Replaces the old email contact page. Visitors pin a note to the board;
 * the note lands in GitHub as an issue for moderation; approved notes are
 * synced back into /assets/data/board.json and rendered here.
 *
 * Two submission modes, selected by BOARD_CONFIG.endpoint:
 *
 *   1. ENDPOINT MODE (endpoint set) - posts JSON to a Cloudflare Worker,
 *      which opens the GitHub issue on the visitor's behalf. No account
 *      needed. See workers/board-inbox/ for the Worker.
 *
 *   2. FALLBACK MODE (endpoint empty) - opens a pre-filled GitHub issue
 *      form in a new tab. Works with zero infrastructure, but the visitor
 *      needs a GitHub account.
 *
 * All post content is visitor-submitted, so every value rendered here goes
 * through DurtNursUtils.escapeHTML before it touches innerHTML.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const BOARD_CONFIG = {
  /**
   * Cloudflare Worker URL that accepts board submissions.
   * Leave as '' to run in fallback mode (pre-filled GitHub issue).
   * Example: 'https://board-inbox.durtnurs.workers.dev'
   */
  endpoint: 'https://board-inbox.durtnurs.workers.dev',

  /** GitHub repo that holds the board issues (owner/name). */
  githubRepo: 'CuWilliams/durtnurs.github.io',

  /** Path to the synced board data. */
  dataPath: '/assets/data/board.json',

  /** Maximum lengths, enforced here and again in the Worker. */
  maxNameLength: 40,
  maxMessageLength: 600,

  /**
   * Minimum seconds between page load and submit. Bots fill and submit
   * instantly; humans take longer than this to write anything worth reading.
   */
  minDwellSeconds: 4
};

/**
 * Paper styles a note can be written on. Assigned deterministically from
 * the post id so a note looks the same on every visit and every build.
 */
const NOTE_STYLES = ['index', 'lined', 'sticky', 'napkin', 'receipt', 'flyer', 'card'];

/** Pushpin colours, also assigned deterministically. */
const PIN_COLORS = ['red', 'yellow', 'blue', 'green', 'white'];

/** How a note is stuck to the board. */
const FASTENERS = ['tack', 'tack', 'tack', 'tape', 'staple'];

// =============================================================================
// DETERMINISTIC PSEUDO-RANDOMNESS
// =============================================================================

/**
 * Hashes a string to a 32-bit unsigned integer (FNV-1a).
 * Used so each note's rotation, paper and pin derive from its id and stay
 * put across reloads instead of shuffling on every render.
 *
 * @param {string} str - Input string
 * @returns {number} Unsigned 32-bit hash
 */
function hashString(str) {
  let hash = 2166136261;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * Derives a stable pseudo-random number in [0, 1) from a seed string.
 *
 * @param {string} seed - Seed string (usually postId + salt)
 * @returns {number} Value in [0, 1)
 */
function seededValue(seed) {
  return hashString(seed) / 4294967296;
}

/**
 * Picks an item from an array using a seeded value.
 *
 * @param {Array} list - Items to choose from
 * @param {string} seed - Seed string
 * @returns {*} Chosen item
 */
function seededPick(list, seed) {
  return list[Math.floor(seededValue(seed) * list.length)];
}

/**
 * Builds the physical presentation of a note: paper, pin, fastener, tilt.
 * Explicit values in the JSON always win, so hand-authored notes can be
 * art-directed while visitor notes get a stable random look.
 *
 * @param {Object} post - Post data object
 * @returns {Object} Presentation values
 */
function noteAppearance(post) {
  const id = post.id || post.date || 'note';

  return {
    style: post.style || seededPick(NOTE_STYLES, id + ':style'),
    pin: post.pin || seededPick(PIN_COLORS, id + ':pin'),
    fastener: post.fastener || seededPick(FASTENERS, id + ':fastener'),
    // -3.5deg to +3.5deg, enough to read as hand-pinned without looking broken
    rotation: typeof post.rotation === 'number'
      ? post.rotation
      : (seededValue(id + ':rot') * 7 - 3.5).toFixed(2)
  };
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Renders the band's reply scrawled across the bottom of a note.
 *
 * @param {Object} reply - Reply object ({ from, date, text })
 * @returns {string} HTML string, or '' when there is no reply
 */
function renderReply(reply) {
  if (!reply || !reply.text) return '';

  const from = DurtNursUtils.escapeHTML(reply.from || 'tHE dURT nURS\'');
  const text = DurtNursUtils.escapeHTMLWithBreaks(reply.text);

  return `
    <div class="board-note__reply">
      <p class="board-note__reply-text">${text}</p>
      <p class="board-note__reply-from">&mdash; ${from}</p>
    </div>
  `;
}

/**
 * Renders a single pinned note.
 *
 * @param {Object} post - Post data object
 * @returns {string} HTML string for the note
 */
function renderNote(post) {
  const { style, pin, fastener, rotation } = noteAppearance(post);

  // Visitor-controlled values - escape everything
  const name = DurtNursUtils.escapeHTML(post.name || 'Anonymous');
  const message = DurtNursUtils.escapeHTMLWithBreaks(post.message || '');
  const id = DurtNursUtils.escapeHTML(post.id || '');

  const dateAttr = DurtNursUtils.escapeHTML(post.date || '');
  const dateLabel = post.date ? DurtNursUtils.formatDate(post.date) : '';

  const pinnedClass = post.pinned ? ' board-note--pinned' : '';
  const fastenerClass = `board-note__fastener board-note__fastener--${fastener}`;
  const pinClass = fastener === 'tack' ? ` board-note__fastener--${pin}` : '';

  return `
    <article class="board-note board-note--${style}${pinnedClass}"
             id="${id}"
             style="--note-rotation: ${rotation}deg;">

      <span class="${fastenerClass}${pinClass}" aria-hidden="true"></span>

      <div class="board-note__paper">
        <p class="board-note__message">${message}</p>

        <footer class="board-note__meta">
          <span class="board-note__name">&mdash; ${name}</span>
          ${dateLabel ? `<time class="board-note__date" datetime="${dateAttr}">${dateLabel}</time>` : ''}
        </footer>

        ${renderReply(post.reply)}
      </div>
    </article>
  `;
}

/**
 * Sorts posts for display: pinned notes first, then newest to oldest.
 *
 * @param {Array} posts - Post objects
 * @returns {Array} New sorted array
 */
function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
}

/**
 * Loads board.json and renders every note into the board container.
 */
async function renderBoard() {
  const container = document.getElementById('board-notes');
  if (!container) return;

  try {
    DurtNursUtils.debug('📌 Fetching board posts...');

    /*
      board.json is served with a four-hour max-age, so a returning visitor
      would keep a stale copy and miss newly approved notes for that long.
      The build stamp in <meta name="asset-version"> changes on every deploy,
      and approving a note triggers a deploy, so this URL changes exactly when
      the data does - fresh when it matters, still cacheable in between.
    */
    const version = document.querySelector('meta[name="asset-version"]');
    const dataURL = version
      ? `${BOARD_CONFIG.dataPath}?v=${encodeURIComponent(version.content)}`
      : BOARD_CONFIG.dataPath;

    const data = await DurtNursUtils.fetchJSON(dataURL);
    const posts = Array.isArray(data.posts) ? data.posts : [];

    if (posts.length === 0) {
      container.innerHTML = `
        <p class="board-empty">
          Board's bare. Either nobody's written anything yet, or we took it all down.
          Be the first. Or the next.
        </p>
      `;
      return;
    }

    /*
      Render each note in isolation. Board content is visitor-submitted, so a
      single malformed post must not throw its way out to the catch below and
      replace the entire board with an error. Drop the bad one, keep the wall.
    */
    let rendered = 0;
    const html = sortPosts(posts).reduce((markup, post) => {
      try {
        const note = renderNote(post);
        rendered++;
        return markup + note;
      } catch (error) {
        DurtNursUtils.debugError(`⚠️ Skipped note ${post && post.id}:`, error);
        return markup;
      }
    }, '');

    // Posts existed but none survived rendering - that is a fault, not an
    // empty board, so let the catch report it honestly.
    if (rendered === 0) {
      throw new Error('every note failed to render');
    }

    container.innerHTML = html;
    DurtNursUtils.debug(`✅ Rendered ${rendered} of ${posts.length} board notes`);

  } catch (error) {
    DurtNursUtils.debugError('❌ Error loading board posts:', error);
    container.innerHTML = `
      <p class="board-empty" role="alert">
        The board fell off the wall. Everything that was on it is in a pile on the floor.
        Try again in a bit.
      </p>
    `;
  }
}

// =============================================================================
// SUBMISSION
// =============================================================================

/** Timestamp of the last board init, used for the dwell-time spam check. */
let boardLoadedAt = Date.now();

/**
 * Shows a status message under the form.
 *
 * @param {HTMLElement} statusEl - Status container
 * @param {string} message - Message text
 * @param {string} state - 'pending' | 'success' | 'error'
 */
function setStatus(statusEl, message, state) {
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `board-form__status board-form__status--${state}`;
  statusEl.hidden = false;
}

/**
 * Builds a pre-filled GitHub issue URL for fallback mode.
 *
 * @param {string} name - Submitter name
 * @param {string} message - Note text
 * @returns {string} GitHub "new issue" URL
 */
function buildGitHubIssueURL(name, message) {
  const params = new URLSearchParams({
    title: `Board note from ${name}`,
    body: `${message}\n\n---\nPosted from the board at durtnurs.com`,
    labels: 'board-post'
  });

  return `https://github.com/${BOARD_CONFIG.githubRepo}/issues/new?${params.toString()}`;
}

/**
 * Validates the form values that both modes share.
 *
 * @param {string} name - Submitter name
 * @param {string} message - Note text
 * @returns {string|null} Error message, or null when valid
 */
function validateSubmission(name, message) {
  if (!message) {
    return 'You pinned up a blank piece of paper. Write something on it first.';
  }

  if (message.length > BOARD_CONFIG.maxMessageLength) {
    return `That's ${message.length} characters. The board holds ${BOARD_CONFIG.maxMessageLength}. Cut it down or write a song instead.`;
  }

  if (name.length > BOARD_CONFIG.maxNameLength) {
    return `That name is longer than most of our songs. ${BOARD_CONFIG.maxNameLength} characters, tops.`;
  }

  return null;
}

/**
 * Handles the form submit for both endpoint and fallback modes.
 *
 * @param {SubmitEvent} event - Submit event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const statusEl = form.querySelector('.board-form__status');
  const submitButton = form.querySelector('.board-form__submit');

  const name = (form.elements.name.value || '').trim() || 'Anonymous';
  const message = (form.elements.message.value || '').trim();

  // Honeypot: a hidden field only an automated filler would populate.
  // Pretend it worked so bots don't learn anything from the response.
  if (form.elements.website && form.elements.website.value) {
    DurtNursUtils.debugWarn('🍯 Honeypot tripped, silently discarding');
    setStatus(statusEl, 'Pinned up. Thanks.', 'success');
    form.reset();
    return;
  }

  // Dwell check: nobody writes and submits a real note in under a few seconds
  const dwellSeconds = (Date.now() - boardLoadedAt) / 1000;
  if (dwellSeconds < BOARD_CONFIG.minDwellSeconds) {
    setStatus(statusEl, 'Slow down. The board has been there since 1993, it can wait another second.', 'error');
    return;
  }

  const validationError = validateSubmission(name, message);
  if (validationError) {
    setStatus(statusEl, validationError, 'error');
    return;
  }

  // Fallback mode: hand the visitor a pre-filled GitHub issue
  if (!BOARD_CONFIG.endpoint) {
    window.open(buildGitHubIssueURL(name, message), '_blank', 'noopener');
    setStatus(
      statusEl,
      'We sent you over to GitHub to finish pinning it up. Hit the green button there and it lands on our end.',
      'success'
    );
    return;
  }

  // Endpoint mode: post to the Worker
  submitButton.disabled = true;
  setStatus(statusEl, 'Looking for a thumbtack...', 'pending');

  try {
    const response = await fetch(BOARD_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    setStatus(
      statusEl,
      "Pinned. One of us will wander past the board eventually and read it. No promises past that.",
      'success'
    );
    form.reset();
    boardLoadedAt = Date.now();

  } catch (error) {
    DurtNursUtils.debugError('❌ Board submission failed:', error);
    setStatus(
      statusEl,
      'That didn\'t take. Either the board is full or we forgot to pay for something. Try again later.',
      'error'
    );

  } finally {
    submitButton.disabled = false;
  }
}

/**
 * Wires up the form: live character counter, mode-specific hints, submit.
 */
function initForm() {
  const form = document.getElementById('board-form');
  if (!form) return;

  const counter = form.querySelector('.board-form__counter');
  const messageField = form.elements.message;

  messageField.setAttribute('maxlength', BOARD_CONFIG.maxMessageLength);

  if (counter) {
    const updateCounter = () => {
      const remaining = BOARD_CONFIG.maxMessageLength - messageField.value.length;
      counter.textContent = `${remaining} characters of board left`;
    };

    messageField.addEventListener('input', updateCounter);
    updateCounter();
  }

  // Fallback mode sends people to GitHub - say so before they type
  const modeNote = form.querySelector('.board-form__mode-note');
  if (modeNote && !BOARD_CONFIG.endpoint) {
    modeNote.hidden = false;
  }

  form.addEventListener('submit', handleSubmit);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the board page. Safe to call again after SPA navigation.
 */
function init() {
  if (!document.getElementById('board-notes')) return;

  DurtNursUtils.debug('🚀 Initializing message board...');
  boardLoadedAt = Date.now();

  renderBoard();
  initForm();
}

DurtNursUtils.onDOMReady(init);

// Register with SPA navigation so the board rebuilds after client-side nav
if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('board', init, {
    pages: ['board']
  });
}
