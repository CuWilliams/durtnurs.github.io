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

  /**
   * How stale the notes are allowed to get. The fetch URL carries a bucket
   * number derived from the wall clock rather than the build stamp, so the
   * board refreshes on this cadence even when the CDN is still serving an
   * old copy of the page around it. Five minutes: long enough that visitors
   * still share a cached copy, short enough that approving a note feels
   * immediate.
   */
  dataMaxAgeMs: 5 * 60 * 1000,

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
             data-rotation="${rotation}"
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

// =============================================================================
// LAYOUT
// Notes are packed into explicit columns rather than poured into a CSS
// multi-column container. See the NOTE COLUMNS comment in board.css for why.
// =============================================================================

const BOARD_LAYOUT = {
  /*
    How far a rotated corner may swing past its column edge, in pixels. The
    gutter between columns is --space-lg (32px), so two notes leaning toward
    each other spend at most 24px of it and 8px of cork always shows between.
  */
  maxOverhangPx: 12,

  /** Widest tilt any note is allowed, matching noteAppearance's range. */
  maxRotationDeg: 3.5,

  /** Ignore resizes smaller than this. Repacking is not free. */
  resizeThresholdPx: 8
};

/** Bumped on every init() so stale async work can tell it has been replaced. */
let renderToken = 0;

/** The live ResizeObserver, kept so SPA navigation can disconnect it. */
let boardObserver = null;

/**
 * Caps a note's tilt so its painted corners stay inside the gutter.
 *
 * transform: rotate() is a paint-time operation - layout still sizes the
 * upright box - so a tilted note silently overhangs its column by
 * (height / 2) * sin(angle). At 3.5deg a 900px note reaches 27px into a 32px
 * gutter, and its neighbour reaches back. The overhang scales with height and
 * nothing was damping it, so tall notes collided while short ones looked fine.
 *
 * Clamping the angle rather than reserving horizontal margin avoids a
 * feedback loop: narrowing a note makes it taller, which increases its
 * overhang, which demands more margin. Width is fixed first, height follows,
 * tilt is chosen last.
 *
 * It also reads as physics rather than as a constraint. A post-it hangs
 * crooked; a full sheet of paper hangs straight.
 *
 * @param {number} degrees - The seeded, un-clamped tilt
 * @param {number} heightPx - The note's laid-out height
 * @returns {number} Tilt in degrees, within the overhang budget
 */
function clampRotation(degrees, heightPx) {
  if (!heightPx || !isFinite(degrees)) return degrees || 0;

  const ratio = (2 * BOARD_LAYOUT.maxOverhangPx) / heightPx;
  const limit = ratio >= 1 ? 90 : Math.asin(ratio) * (180 / Math.PI);
  const max = Math.min(BOARD_LAYOUT.maxRotationDeg, limit);

  return Math.max(-max, Math.min(max, degrees));
}

/**
 * Reads the column count the stylesheet is currently using. The breakpoints
 * live in board.css only; this just asks what they decided.
 *
 * @param {HTMLElement} container - The notes container
 * @returns {number} Column count, at least 1
 */
function readColumnCount(container) {
  const raw = getComputedStyle(container).getPropertyValue('--board-columns');
  const count = parseInt(raw, 10);
  return count > 0 ? count : 1;
}

/**
 * Packs notes into explicit columns, shortest column first, and clamps each
 * note's tilt to its measured height.
 *
 * The measure-then-place order matters:
 *
 *   - Every note is appended to column 0 first. The tracks are equal widths
 *     (minmax(0, 1fr)), so a height measured there holds in any column.
 *   - offsetHeight, not getBoundingClientRect().height. The latter returns
 *     the TRANSFORMED rect - inflated by the very tilt we are about to
 *     change - which would feed rotation back into the packing.
 *   - Nothing awaits between the measuring loop and the placing loop.
 *     Reading offsetHeight flushes layout synchronously, but the browser does
 *     not paint until the task yields, so the intermediate one-column stack
 *     is never rasterised and there is no flash.
 *
 * @param {HTMLElement} container - The notes container
 * @param {Array<HTMLElement>} notes - Note elements, in display order
 */
function layoutNotes(container, notes) {
  const count = readColumnCount(container);
  const gap = parseFloat(getComputedStyle(container).rowGap) || 0;

  const columns = [];
  for (let i = 0; i < count; i++) {
    const column = document.createElement('div');
    column.className = 'board-notes__column';
    columns.push(column);
  }

  container.replaceChildren(...columns);
  columns[0].append(...notes);

  // One forced layout for all of them, then no more reads.
  const heights = notes.map(note => note.offsetHeight);

  const used = new Array(count).fill(0);

  notes.forEach((note, i) => {
    /*
      Ties break toward the leftmost column. Every column starts at zero, so
      the first few notes - the pinned ones, then the newest - land across the
      top row left to right, and the board still reads in order at a glance.
    */
    let target = 0;
    for (let c = 1; c < count; c++) {
      if (used[c] < used[target] - 0.5) target = c;
    }

    columns[target].appendChild(note);
    used[target] += heights[i] + gap;

    /*
      Always clamp from the seeded value in data-rotation, never from the
      current --note-rotation. Re-clamping an already-clamped angle on every
      resize would ratchet the board flat.
    */
    const seeded = parseFloat(note.dataset.rotation) || 0;
    const tilt = clampRotation(seeded, heights[i]);
    note.style.setProperty('--note-rotation', tilt.toFixed(2) + 'deg');
  });
}

/**
 * Packs the notes and keeps them packed: re-runs when the webfonts land and
 * when the container's width changes.
 *
 * @param {HTMLElement} container - The notes container
 * @param {Array<HTMLElement>} notes - Note elements, in display order
 * @param {number} token - The renderToken this render belongs to
 */
function layoutAndObserve(container, notes, token) {
  const run = () => {
    if (token !== renderToken || !container.isConnected) return;
    try {
      layoutNotes(container, notes);
    } catch (error) {
      // A layout failure must not cost the visitor the notes themselves.
      DurtNursUtils.debugError('⚠️ Board layout failed, falling back to one column:', error);
      container.replaceChildren(...notes);
    }
  };

  run();

  /*
    Caveat, Special Elite and Permanent Marker load with display=swap, so the
    first pack is measured against fallback metrics. Repack once they land.
  */
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(run);
  }

  if (typeof ResizeObserver === 'undefined') return;

  /*
    The container is fluid below 1200px, so track width - and with it note
    heights, the packing and the tilt clamp - changes continuously, not only
    at the 640/1024 breakpoints. Watching the element is more honest than
    matchMedia.

    Repacking changes the container's HEIGHT, which the observer also sees, so
    only act on width deltas, and record the new width before mutating.
  */
  let lastWidth = container.getBoundingClientRect().width;

  boardObserver = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - lastWidth) < BOARD_LAYOUT.resizeThresholdPx) return;
    lastWidth = width;
    requestAnimationFrame(run);
  });

  boardObserver.observe(container);
}

/**
 * Tears down the packing so a message can own the board.
 *
 * The empty and error states replace the container's contents wholesale. Any
 * observer or pending fonts.ready callback left over from a previous render
 * would happily pack the old notes back on top of that message, so both
 * states clear the layout first.
 */
function clearBoardLayout() {
  renderToken++;
  if (boardObserver) {
    boardObserver.disconnect();
    boardObserver = null;
  }
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

  /*
    board.json can resolve long after the visitor has navigated away and back,
    by which point this container is detached and a newer render owns the
    board. Every async continuation below checks it still holds the current
    token before touching the DOM.
  */
  const token = renderToken;

  try {
    DurtNursUtils.debug('📌 Fetching board posts...');

    /*
      board.json is cached at the edge and in the browser, so a returning
      visitor would keep a stale copy and miss newly approved notes.

      The build stamp in <meta name="asset-version"> is the obvious key and it
      is the wrong one: it is baked into the page, so a stale page asks for a
      stale board, and the two go out of date together. Hours after a note was
      approved the CDN was still handing out the old page, the old stamp, and
      the old notes - all of it self-consistently wrong.

      A clock the page does not control breaks that loop. The bucket changes
      every BOARD_CONFIG.dataMaxAgeMs no matter how old the HTML around it is,
      so the notes are never more than that far behind, and every visitor in
      the same bucket still shares one cached copy.
    */
    const bucket = Math.floor(Date.now() / BOARD_CONFIG.dataMaxAgeMs);
    const dataURL = `${BOARD_CONFIG.dataPath}?t=${bucket}`;

    const data = await DurtNursUtils.fetchJSON(dataURL);
    if (token !== renderToken) return;

    const posts = Array.isArray(data.posts) ? data.posts : [];

    if (posts.length === 0) {
      clearBoardLayout();
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

    /*
      Parse once, then hand real elements to the packer. Using a <template>
      rather than assigning innerHTML to the container means the notes are
      never children of the container directly - they go straight into the
      column elements layoutNotes builds. content.children also drops the
      whitespace text nodes between articles for free.
    */
    const template = document.createElement('template');
    template.innerHTML = html;
    const notes = Array.from(template.content.children);

    layoutAndObserve(container, notes, token);

    DurtNursUtils.debug(`✅ Rendered ${rendered} of ${posts.length} board notes`);

  } catch (error) {
    if (token !== renderToken) return;
    DurtNursUtils.debugError('❌ Error loading board posts:', error);
    clearBoardLayout();
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

  /*
    Invalidate any render still in flight from a previous visit to this page,
    and drop the observer it left watching a container that is about to be
    replaced. Without this, SPA navigation accumulates one observer per visit.
  */
  renderToken++;
  if (boardObserver) {
    boardObserver.disconnect();
    boardObserver = null;
  }

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
