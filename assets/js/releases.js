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
 *
 * The Fetch API is a modern interface for making HTTP requests.
 * It returns a Promise, representing an asynchronous operation.
 * We use async/await syntax to handle Promises more readably.
 *
 * Why async/await?
 * - Makes asynchronous code look synchronous
 * - Easier error handling with try/catch
 * - More readable than .then() chains
 *
 * @returns {Promise<Array>} Array of release objects
 */
async function fetchReleases() {
  try {
    // fetch() sends HTTP GET request to the specified URL
    // Returns a Promise that resolves to a Response object
    console.log('📡 Fetching releases from JSON...');
    const response = await fetch('assets/data/releases.json');

    // Check HTTP response status
    // response.ok is true for status codes 200-299
    // If false, throw error to jump to catch block
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse response body as JSON
    // .json() also returns a Promise, so we await it
    // This converts JSON string to JavaScript object
    const data = await response.json();

    console.log(`✅ Successfully loaded ${data.releases.length} releases`);

    // Return the releases array from the parsed data
    return data.releases;

  } catch (error) {
    // Catch any errors: network failures, invalid JSON, 404s, etc.
    console.error('❌ Error fetching releases:', error);

    // Display user-friendly error message in UI
    displayError('Unable to load releases. Please try again later.');

    // Return empty array so rest of code doesn't break
    // This is defensive programming - fail gracefully
    return [];
  }
}

/**
 * Displays an error message to the user
 * Called when releases data cannot be loaded
 *
 * @param {string} message - Error message to display
 */
function displayError(message) {
  // Find the container where releases should appear
  // Try both homepage and dedicated releases page containers
  const container = document.getElementById('releases-grid') ||
                   document.getElementById('homepage-releases');

  if (container) {
    // Create error message HTML
    // role="alert" announces error to screen readers
    container.innerHTML = `
      <div class="error-message" role="alert">
        <p><strong>Oops!</strong> ${message}</p>
      </div>
    `;
  }
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Converts ISO date string to readable format
 * Example: "2024-11-15" becomes "November 15, 2024"
 *
 * Why use Intl.DateTimeFormat?
 * - Locale-aware formatting (respects user's language/region)
 * - Built into JavaScript (no external libraries needed)
 * - Handles edge cases (time zones, leap years, etc.)
 *
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
function formatDate(isoDate) {
  // Create Date object from ISO string
  // JavaScript Date constructor parses ISO 8601 format automatically
  const date = new Date(isoDate);

  // Intl.DateTimeFormat provides internationalized date formatting
  // 'en-US' specifies American English conventions
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',   // Full year (2024)
    month: 'long',     // Full month name (November)
    day: 'numeric'     // Day without leading zero (15)
  });

  return formatter.format(date);
}

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

  // Format dates for display
  const formattedDate = formatDate(releaseDate);
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
             onerror="this.src='assets/images/logo.png'; this.alt='Album cover unavailable';">
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

/**
 * Wait for DOM to be fully loaded before running code
 *
 * DOMContentLoaded event fires when:
 * - HTML is fully parsed
 * - DOM tree is complete
 * - All deferred scripts have executed
 *
 * Why wait for DOMContentLoaded?
 * - Ensures all elements exist before we try to manipulate them
 * - Prevents "element not found" errors
 * - Best practice for DOM manipulation scripts
 *
 * Alternative: Place <script> at end of <body>
 * But this approach is more explicit and works anywhere
 */
if (document.readyState === 'loading') {
  // DOM is still loading, wait for event
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded (script was deferred or loaded late)
  // Run immediately
  init();
}

// =============================================================================
// FUTURE ENHANCEMENTS (commented out for now)
// =============================================================================

/**
 * POTENTIAL FEATURES TO ADD:
 *
 * 1. Filtering by release type:
 *    - Add buttons/tabs for "All", "Albums", "EPs", "Live", etc.
 *    - Filter releases array before rendering
 *
 * 2. Search functionality:
 *    - Input field to search by title, artist, or track name
 *    - Filter releases based on search term
 *
 * 3. Lightbox for album covers:
 *    - Click cover to view full-size image
 *    - Implement modal overlay
 *
 * 4. Lazy loading optimization:
 *    - Only render visible cards initially
 *    - Load more as user scrolls
 *    - Use Intersection Observer API
 *
 * 5. Animation on scroll:
 *    - Cards fade in as they enter viewport
 *    - Use Intersection Observer + CSS transitions
 *
 * 6. Real streaming links:
 *    - Replace "#" placeholders with actual URLs
 *    - Add more platforms (YouTube Music, Tidal, etc.)
 */

// =============================================================================
// EXPORTS (for potential future module usage)
// =============================================================================

/**
 * If using ES6 modules in the future, uncomment this to export functions
 * Allows other scripts to import and use these functions
 * Example: import { fetchReleases, renderReleaseCard } from './releases.js'
 */
// export { fetchReleases, renderReleaseCard, renderAllReleases, formatDate };
