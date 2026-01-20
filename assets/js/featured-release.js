/**
 * FEATURED RELEASE MODULE
 * Dynamically loads and displays the featured release on the homepage
 *
 * PURPOSE:
 * This module eliminates content duplication by creating a single source of truth.
 * Instead of hardcoding release information in index.html, we:
 * 1. Fetch data from releases.json (same data used by /releases/)
 * 2. Find the release marked as "featured": true
 * 3. Dynamically populate the homepage featured section
 *
 * BENEFITS:
 * - Single source of truth: Update releases.json once, changes appear everywhere
 * - Easy to change featured release: Just flip the "featured" flag in JSON
 * - Maintainable: No hunting through HTML to update release info
 * - Scalable: Same pattern works for any dynamic content
 *
 * This module demonstrates:
 * - Fetch API for loading JSON data
 * - Array methods (find, sort) for data lookup
 * - Template literals for HTML generation
 * - Progressive enhancement (works without JavaScript via noscript fallback)
 * - Error handling with try/catch
 * - DOM manipulation for dynamic content
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration object for the module
 * Centralizes all IDs and paths in one place for easy maintenance
 */
const CONFIG = {
  dataUrl: '/assets/data/releases.json',
  containerId: 'featured-release-container',
  loadingId: 'featured-release-loading',
  errorId: 'featured-release-error'
};

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches releases data from JSON file
 * Uses shared DurtNursUtils.fetchJSON for HTTP requests.
 *
 * @returns {Promise<Array>} Array of release objects
 * @throws {Error} If fetch fails or JSON is invalid
 */
async function fetchReleases() {
  try {
    console.log('📡 Fetching releases data...');
    const data = await DurtNursUtils.fetchJSON(CONFIG.dataUrl);

    console.log(`✅ Successfully loaded ${data.releases.length} releases`);
    return data.releases;

  } catch (error) {
    console.error('❌ Error fetching releases:', error);
    throw error;
  }
}

// =============================================================================
// DATA LOOKUP
// =============================================================================

/**
 * Finds the featured release from the releases array
 *
 * Strategy:
 * 1. First, look for a release with "featured": true
 * 2. If none found, fallback to the most recent release by date
 *
 * This ensures the homepage always shows something relevant even if
 * someone forgets to set a featured flag.
 *
 * @param {Array} releases - Array of release objects
 * @returns {Object|null} Featured release object or null if array is empty
 */
function findFeaturedRelease(releases) {
  // Edge case: no releases available
  if (!releases || releases.length === 0) {
    console.warn('⚠️ No releases available');
    return null;
  }

  // Try to find a release with featured flag set to true
  // Array.find() returns the first element that matches the condition
  let featured = releases.find(release => release.featured === true);

  if (featured) {
    console.log(`✨ Found featured release: ${featured.title}`);
    return featured;
  }

  // Fallback: No featured release found, use most recent by date
  // Sort by date (newest first) and take the first one
  console.log('ℹ️ No featured flag found, using most recent release');

  // Create a copy of the array before sorting (don't mutate original)
  // Array.slice() creates a shallow copy
  const sortedReleases = releases.slice().sort((a, b) => {
    // Convert ISO date strings to Date objects and compare
    // Subtracting dates gives time difference in milliseconds
    // b - a sorts descending (newest first)
    return new Date(b.releaseDate) - new Date(a.releaseDate);
  });

  // Return the most recent release (first in sorted array)
  const mostRecent = sortedReleases[0];
  console.log(`📅 Using most recent release: ${mostRecent.title}`);
  return mostRecent;
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Builds HTML for streaming links section
 * Only includes active links (not placeholders marked with "#")
 *
 * @param {Object} streamingLinks - Object with platform keys and URL values
 * @returns {string} HTML string for streaming links
 */
function buildStreamingLinks(streamingLinks) {
  // If no streaming links provided, return empty string
  if (!streamingLinks || Object.keys(streamingLinks).length === 0) {
    return '';
  }

  // Convert streamingLinks object to array of [platform, url] pairs
  // Filter out placeholder links (marked with "#")
  // Map to HTML anchor elements
  const linksHTML = Object.entries(streamingLinks)
    .filter(([platform, url]) => url && url !== '#')
    .map(([platform, url]) => {
      // Capitalize platform name: spotify -> Spotify
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

      return `
        <a href="${url}"
           class="button button--secondary"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="Listen on ${platformName}">
          Listen on ${platformName}
        </a>
      `;
    })
    .join('');

  return linksHTML;
}

/**
 * Renders the featured release HTML into the container
 *
 * This function generates the complete HTML structure for the featured release
 * and inserts it into the DOM. The structure matches the existing design
 * from the original hardcoded version.
 *
 * HTML Structure follows BEM (Block Element Modifier) naming:
 * - album-card (Block)
 * - album-card__artwork (Element)
 * - album-card__details (Element)
 * etc.
 *
 * @param {Object} release - Release object to render
 */
function renderFeaturedRelease(release) {
  // Get the container element where we'll insert the HTML
  const container = document.getElementById(CONFIG.containerId);

  if (!container) {
    console.error(`❌ Container #${CONFIG.containerId} not found`);
    return;
  }

  // Destructure release data for cleaner code
  const {
    title,
    artist,
    releaseDate,
    type,
    coverArt,
    coverArtAlt,
    description,
    streamingLinks
  } = release;

  // Format the release date for display
  const formattedDate = DurtNursUtils.formatDate(releaseDate);

  // Build streaming links HTML
  const streamingLinksHTML = buildStreamingLinks(streamingLinks);

  // Generate complete HTML using template literals
  // Template literals allow multi-line strings and embedded expressions
  const html = `
    <div class="album-card">
      <!-- Album Cover Artwork -->
      <div class="album-card__artwork">
        <img src="${coverArt}"
             alt="${coverArtAlt}"
             class="album-card__image"
             loading="eager"
             onerror="this.src='/assets/images/logo.png'; this.alt='Album cover unavailable';">
      </div>

      <!-- Album Details and Actions -->
      <div class="album-card__details">
        <!-- Release Title -->
        <h3 class="album-card__title">${title}</h3>

        <!-- Release Type (Album, EP, Single, etc.) -->
        <p class="album-card__subtitle">${type.charAt(0).toUpperCase() + type.slice(1)}</p>

        <!-- Release Date with semantic time element -->
        <time class="album-card__date" datetime="${releaseDate}">
          Release Date: ${formattedDate}
        </time>

        <!-- Album Description -->
        <p class="album-card__description">${description}</p>

        <!-- Streaming Links and Actions -->
        <div class="album-card__actions">
          ${streamingLinksHTML}
          <a href="/releases/" class="button button--secondary">View All Releases</a>
        </div>
      </div>
    </div>
  `;

  // Insert the generated HTML into the container
  // innerHTML replaces all existing content
  // Note: This is safe because data comes from our own JSON file
  // Never use innerHTML with untrusted user input (XSS risk)
  container.innerHTML = html;

  console.log(`✅ Featured release rendered: ${title}`);
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Shows the loading state
 * Displays a loading message while data is being fetched
 * Improves perceived performance and user experience
 */
function showLoading() {
  const loadingEl = document.getElementById(CONFIG.loadingId);
  const errorEl = document.getElementById(CONFIG.errorId);
  const container = document.getElementById(CONFIG.containerId);

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';
  if (container) container.innerHTML = ''; // Clear any existing content
}

/**
 * Shows an error message to the user
 * Called when data loading fails or no featured release is found
 *
 * @param {string} message - User-friendly error message
 */
function showError(message) {
  const loadingEl = document.getElementById(CONFIG.loadingId);
  const errorEl = document.getElementById(CONFIG.errorId);

  // Hide loading state
  if (loadingEl) loadingEl.style.display = 'none';

  // Show error message
  if (errorEl) {
    errorEl.style.display = 'block';
    // Update error message if needed
    const errorText = errorEl.querySelector('p');
    if (errorText && message) {
      errorText.innerHTML = `${message} <a href="/releases/">View all releases</a>.`;
    }
  }

  // Log to console for debugging
  console.error(`❌ Error: ${message}`);
}

/**
 * Hides both loading and error states
 * Called after successful rendering
 */
function hideStates() {
  const loadingEl = document.getElementById(CONFIG.loadingId);
  const errorEl = document.getElementById(CONFIG.errorId);

  if (loadingEl) loadingEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
}

/**
 * Shows/hides the entire Featured Release section
 * Implements collapse behavior when no featured release exists
 *
 * @param {boolean} hasContent - Whether to show the section
 */
function toggleSectionVisibility(hasContent) {
  const section = document.getElementById('latest-release');
  if (section) {
    section.style.display = hasContent ? '' : 'none';
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Main initialization function
 * Orchestrates the entire featured release loading and rendering process
 *
 * Flow:
 * 1. Show loading state
 * 2. Fetch releases data
 * 3. Find featured release
 * 4. Render featured release
 * 5. Hide loading state
 * 6. Handle any errors gracefully
 */
async function init() {
  console.log('🚀 Initializing featured release module...');

  try {
    // Step 1: Show loading indicator
    showLoading();

    // Step 2: Fetch releases data from JSON
    const releases = await fetchReleases();

    // Step 3: Find the featured release
    const featuredRelease = findFeaturedRelease(releases);

    // Check if we found a release to display
    // If no featured release, hide the entire section
    if (!featuredRelease) {
      console.log('ℹ️ No featured release found, hiding section');
      toggleSectionVisibility(false);
      return;
    }

    // Step 4: Render the featured release
    renderFeaturedRelease(featuredRelease);

    // Step 5: Hide loading/error states
    hideStates();

    console.log('✅ Featured release module initialized successfully');

  } catch (error) {
    // Catch any errors that occurred during the process
    console.error('❌ Failed to initialize featured release:', error);
    showError('Unable to load featured release.');
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded before running code
DurtNursUtils.onDOMReady(init);

// =============================================================================
// EDUCATIONAL NOTES
// =============================================================================

/**
 * KEY CONCEPTS DEMONSTRATED IN THIS MODULE:
 *
 * 1. SINGLE SOURCE OF TRUTH
 *    Before: Release info duplicated in index.html and releases.json
 *    After: One JSON file feeds both homepage and releases page
 *    Benefit: Update once, changes appear everywhere
 *
 * 2. PROGRESSIVE ENHANCEMENT
 *    - Without JavaScript: Fallback message shows (see noscript tag in HTML)
 *    - With JavaScript: Dynamic featured release displays
 *    - Benefit: Site works for everyone, enhanced for capable browsers
 *
 * 3. SEPARATION OF CONCERNS
 *    - Data: releases.json (content)
 *    - Presentation: CSS (styling)
 *    - Behavior: This JavaScript file (functionality)
 *    - Benefit: Each layer is independent and maintainable
 *
 * 4. ASYNC/AWAIT PATTERN
 *    - Makes asynchronous code read like synchronous code
 *    - Easier to understand than callback hell or .then() chains
 *    - Better error handling with try/catch
 *
 * 5. DEFENSIVE PROGRAMMING
 *    - Check if elements exist before manipulating them
 *    - Handle errors gracefully with user-friendly messages
 *    - Provide fallbacks when data is missing
 *    - Never crash - degrade gracefully
 *
 * WORKFLOW TO UPDATE FEATURED RELEASE:
 * 1. Open releases.json
 * 2. Find the old featured release, set "featured": false
 * 3. Find the new release, set "featured": true
 * 4. Save the file
 * 5. Done! Both homepage and releases page update automatically
 */

