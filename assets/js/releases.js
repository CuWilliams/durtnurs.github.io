/**
 * RELEASES MODULE
 * Handles dynamic loading and rendering of album/release data from JSON
 *
 * This module demonstrates:
 * - Fetch API for loading external JSON data
 * - Array methods (slice, map, sort) for data manipulation
 * - Template literals for clean HTML generation
 * - DOM manipulation for dynamic content
 * - Progressive enhancement (works alongside static HTML fallback)
 * - Error handling with try/catch
 * - Date formatting with Intl API
 *
 * DATA STRUCTURE DOCUMENTATION:
 * Each release object in releases.json contains:
 * - id: Unique identifier (kebab-case, e.g., "release-kraken-2024")
 *   Used for: deep linking, CSS targeting, JavaScript references
 * - title: Album/release name (string)
 * - artist: Band name (string, typically "tHE dURT nURS'")
 * - releaseDate: ISO 8601 date format (YYYY-MM-DD)
 *   Why ISO? Universal standard, sortable, parseable by JavaScript Date()
 * - type: Release category (string: "album", "ep", "single", "live", "compilation")
 *   Used for: filtering, styling variations, display logic
 * - coverArt: Path to album artwork image (string, relative to site root)
 * - coverArtAlt: Accessible alt text for cover art (string)
 *   Why stored in data? Ensures alt text is content-managed, not hardcoded
 * - description: Album description (string, supports plain text)
 * - tracklist: Array of track names (strings)
 * - streamingLinks: Object with platform keys (spotify, apple, bandcamp)
 *   Values are URLs (string). Use "#" for placeholder/inactive links
 * - featured: Boolean flag to highlight primary/newest release
 *   Featured releases get special styling (larger cards, prominent borders)
 */

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches releases data from JSON file
 * Uses shared DurtNursUtils.fetchJSON for HTTP requests.
 *
 * @returns {Promise<Array>} Array of release objects
 */
async function fetchReleases() {
  try {
    console.log('📡 Fetching releases from JSON...');
    const data = await DurtNursUtils.fetchJSON('/assets/data/releases.json');

    console.log(`✅ Successfully loaded ${data.releases.length} releases`);
    return data.releases;

  } catch (error) {
    console.error('❌ Error fetching releases:', error);
    DurtNursUtils.displayError('releases-grid', 'Unable to load releases. Please try again later.');
    return [];
  }
}

// =============================================================================
// DATE HELPERS
// =============================================================================

/**
 * Extracts year from ISO date string
 * Used for displaying release year separately
 *
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns {string} Four-digit year
 */
function getYear(isoDate) {
  const date = new Date(isoDate);
  return date.getFullYear().toString();
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Generates HTML for a single release card
 * Uses BEM naming convention for CSS classes
 *
 * BEM (Block Element Modifier) naming structure:
 * - Block: .release-card (standalone component)
 * - Element: .release-card__title (part of component)
 * - Modifier: .release-card--featured (variation)
 *
 * Why BEM?
 * - Prevents CSS naming collisions
 * - Makes component structure clear
 * - Easier to maintain and scale
 *
 * @param {Object} release - Release data object
 * @returns {string} HTML string for the card
 */
function renderReleaseCard(release) {
  // Destructure release object for cleaner code
  // Instead of writing release.title everywhere, we just use title
  const {
    id,
    title,
    artist,
    releaseDate,
    type,
    coverArt,
    coverArtAlt,
    description,
    tracklist,
    streamingLinks,
    featured
  } = release;

  // Format dates for display using shared utility
  const formattedDate = DurtNursUtils.formatDate(releaseDate);
  const year = getYear(releaseDate);

  // Build modifier classes
  // Featured releases get special styling
  const featuredClass = featured ? ' release-card--featured' : '';

  // Type-specific data attribute
  // Allows CSS styling based on release type
  // Example: .release-card[data-type="live"] { ... }
  const dataTypeAttr = `data-type="${type}"`;

  // Generate streaming links HTML
  // Only show links that aren't placeholders (#)
  // Object.entries() converts object to array of [key, value] pairs
  const streamingLinksHTML = Object.entries(streamingLinks)
    .filter(([platform, url]) => url && url !== '#') // Remove empty/placeholder links
    .map(([platform, url]) => `
      <a href="${url}"
         class="release-card__link"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Listen on ${platform}">
        ${platform.charAt(0).toUpperCase() + platform.slice(1)}
      </a>
    `)
    .join(''); // Combine all link HTML strings

  // Generate tracklist HTML
  // Create an ordered list of tracks
  // Optional: could be collapsed/expandable in future
  const tracklistHTML = tracklist && tracklist.length > 0 ? `
    <details class="release-card__tracklist">
      <summary class="release-card__tracklist-toggle">
        Track List (${tracklist.length} tracks)
      </summary>
      <ol class="release-card__tracks">
        ${tracklist.map(track => `<li>${track}</li>`).join('')}
      </ol>
    </details>
  ` : '';

  // Return complete card HTML using template literals
  // Template literals allow:
  // - Multi-line strings
  // - Embedded expressions with ${}
  // - Cleaner than string concatenation
  return `
    <article class="release-card${featuredClass}" id="${id}" ${dataTypeAttr}>

      <!-- Album Cover -->
      <div class="release-card__cover-wrapper">
        <img src="${coverArt}"
             alt="${coverArtAlt}"
             class="release-card__cover"
             loading="lazy"
             onerror="this.src='/assets/images/logo.png'; this.alt='Album cover unavailable';">
      </div>

      <!-- Release Content -->
      <div class="release-card__content">

        <!-- Header: Title and Type Badge -->
        <header class="release-card__header">
          <h3 class="release-card__title">${title}</h3>
          <span class="release-card__type-badge">${type}</span>
        </header>

        <!-- Artist Name -->
        <p class="release-card__artist">${artist}</p>

        <!-- Release Date -->
        <time class="release-card__date" datetime="${releaseDate}">
          ${formattedDate}
        </time>

        <!-- Description -->
        <p class="release-card__description">${description}</p>

        <!-- Tracklist (collapsible) -->
        ${tracklistHTML}

        <!-- Streaming Links -->
        ${streamingLinksHTML ? `
          <div class="release-card__links">
            ${streamingLinksHTML}
          </div>
        ` : ''}

      </div>

    </article>
  `;
}

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

/**
 * Renders all releases to the page
 * Sorts releases by date (newest first)
 * Applies grid layout via CSS
 */
async function renderAllReleases() {
  console.log('🎸 Rendering all releases...');

  // Find the grid container element
  const container = document.getElementById('releases-grid');

  // Defensive check: ensure element exists
  if (!container) {
    console.warn('⚠️ Releases grid container not found');
    return;
  }

  // Show loading message while fetching data
  // Improves perceived performance
  container.innerHTML = '<p class="loading-message">Loading releases...</p>';

  // Fetch release data
  let releases = await fetchReleases();

  // Exit early if no releases loaded (error occurred)
  if (releases.length === 0) {
    return;
  }

  // Sort releases by date (newest first)
  // Array.sort() with custom comparator function
  // Why subtract dates? Date objects can be subtracted to get time difference
  // b - a sorts descending (newest first)
  // a - b would sort ascending (oldest first)
  releases.sort((a, b) => {
    return new Date(b.releaseDate) - new Date(a.releaseDate);
  });

  console.log(`📀 Rendering ${releases.length} releases`);

  // Generate HTML for each release
  // map() transforms each release object into HTML string
  // join('') combines all HTML strings into one
  const cardsHTML = releases
    .map(release => renderReleaseCard(release))
    .join('');

  // Insert generated HTML into the page
  // innerHTML replaces container's content
  // Note: innerHTML is safe here because data comes from our own JSON
  // Never use innerHTML with user-generated content (XSS risk)
  container.innerHTML = cardsHTML;

  console.log('✅ Releases rendered successfully');
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the releases module
 * Detects which page we're on and calls appropriate render function
 *
 * This function runs when the page loads (see auto-initialization below)
 */
function init() {
  console.log('🚀 Initializing releases module...');

  // Check if we're on the releases page
  // Look for the releases grid container
  if (document.getElementById('releases-grid')) {
    console.log('📍 Detected releases page');
    renderAllReleases();
  }
  else {
    console.log('ℹ️ No release containers found on this page');
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded before running code
DurtNursUtils.onDOMReady(init);

