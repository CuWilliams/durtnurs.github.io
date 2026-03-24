/**
 * LV-GEN MODULE
 * Fetches the latest LV-Gen release from GitHub and renders the download section.
 *
 * - Calls the GitHub Releases API to get the current version and .dmg asset URL
 * - Renders a version badge, macOS download card, and coming-soon stubs for
 *   Windows and Linux
 * - Falls back to a static GitHub releases link if the API call fails or
 *   no .dmg asset is found
 * - Registers with the SPA navigation module for page-transition support
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const GITHUB_API_URL =
  'https://api.github.com/repos/CuWilliams/lyric-video-generator/releases/latest';

const FALLBACK_URL =
  'https://github.com/CuWilliams/lyric-video-generator/releases/latest';

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches the latest release from the GitHub Releases API.
 *
 * @returns {Promise<Object|null>} Release object or null on failure
 */
async function fetchLatestRelease() {
  DurtNursUtils.debug('📡 Fetching latest LV-Gen release from GitHub API...');
  const data = await DurtNursUtils.fetchJSON(GITHUB_API_URL);
  DurtNursUtils.debug('✅ LV-Gen release data received:', data.tag_name);
  return data;
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Renders the version badge pill.
 *
 * @param {string} version - e.g. "v0.1.0"
 * @returns {string} HTML string
 */
function renderVersionBadge(version) {
  return `<span class="version-badge">${version}</span>`;
}

/**
 * Renders the three platform cards.
 * macOS gets an active card with a real download URL.
 * Windows and Linux are greyed-out stubs.
 *
 * @param {string|null} macOsUrl - Direct .dmg download URL, or null if unavailable
 * @returns {string} HTML string
 */
function renderPlatformGrid(macOsUrl) {
  const macOsBtn = macOsUrl
    ? `<a href="${macOsUrl}" class="platform-card__btn button button--primary" download>
        Download .dmg
      </a>`
    : `<a href="${FALLBACK_URL}" class="platform-card__btn button button--primary"
        target="_blank" rel="noopener noreferrer">
        View on GitHub
      </a>`;

  return `
    <div class="platform-grid">

      <div class="platform-card platform-card--active">
        <picture class="platform-card__icon" aria-hidden="true">
          <source srcset="/assets/images/lv-gen-icon.webp" type="image/webp">
          <img src="/assets/images/lv-gen-icon.png" alt="LV-Gen">
        </picture>
        <span class="platform-card__name">macOS</span>
        <span class="platform-card__status">Available</span>
        ${macOsBtn}
      </div>

      <div class="platform-card platform-card--unavailable" aria-disabled="true">
        <picture class="platform-card__icon" aria-hidden="true">
          <source srcset="/assets/images/lv-gen-icon.webp" type="image/webp">
          <img src="/assets/images/lv-gen-icon.png" alt="LV-Gen">
        </picture>
        <span class="platform-card__name">Windows</span>
        <span class="platform-card__status">Coming Eventually (Probably)</span>
        <span class="platform-card__btn button button--secondary" aria-disabled="true">
          Not Yet
        </span>
      </div>

      <div class="platform-card platform-card--unavailable" aria-disabled="true">
        <picture class="platform-card__icon" aria-hidden="true">
          <source srcset="/assets/images/lv-gen-icon.webp" type="image/webp">
          <img src="/assets/images/lv-gen-icon.png" alt="LV-Gen">
        </picture>
        <span class="platform-card__name">Linux</span>
        <span class="platform-card__status">Coming Eventually (Probably)</span>
        <span class="platform-card__btn button button--secondary" aria-disabled="true">
          Not Yet
        </span>
      </div>

    </div>
  `;
}

/**
 * Renders the full download section when API data is available.
 *
 * @param {Object} releaseData - GitHub release object
 * @returns {string} HTML string
 */
function renderDownloadSection(releaseData) {
  const version = releaseData.tag_name;
  const dmgAsset = releaseData.assets
    ? releaseData.assets.find(a => a.name.endsWith('.dmg'))
    : null;
  const macOsUrl = dmgAsset ? dmgAsset.browser_download_url : null;

  return `
    <div class="download-section__inner">
      ${renderVersionBadge(version)}
      ${renderPlatformGrid(macOsUrl)}
    </div>
  `;
}

/**
 * Renders the fallback state when the API call fails entirely.
 *
 * @returns {string} HTML string
 */
function renderFallback() {
  return `
    <div class="download-section__fallback">
      <p class="download-section__fallback-note">
        GitHub's releases page appears to be unavailable right now, or we
        forgot to publish one. Either way, the link below should work.
      </p>
      <a
        href="${FALLBACK_URL}"
        class="button button--primary"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Releases on GitHub
      </a>
    </div>
  `;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function init() {
  const container = document.getElementById('lv-gen-download');
  if (!container) return; // Not on the lv-gen page

  container.innerHTML =
    '<p class="loading-message">Checking for the latest version...</p>';

  let releaseData = null;
  try {
    releaseData = await fetchLatestRelease();
  } catch (err) {
    DurtNursUtils.debugError('❌ LV-Gen release fetch failed:', err);
  }

  container.innerHTML = releaseData
    ? renderDownloadSection(releaseData)
    : renderFallback();
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

DurtNursUtils.onDOMReady(init);

if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('lv-gen', init, {
    pages: ['lv-gen']
  });
}
