/**
 * ANNOUNCEMENTS MODULE
 * Handles dynamic loading and rendering of news/announcements from JSON data
 *
 * This module demonstrates:
 * - Fetch API for loading external data
 * - Array methods (slice, map, filter) for data manipulation
 * - Template literals for clean HTML generation
 * - DOM manipulation for dynamic content
 * - Progressive enhancement (works alongside static HTML fallback)
 * - Error handling with try/catch
 */

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches announcements data from JSON file
 * Uses shared DurtNursUtils.fetchJSON for HTTP requests.
 *
 * @returns {Promise<Array>} Array of announcement objects
 */
async function fetchAnnouncements() {
  try {
    console.log('📡 Fetching announcements from JSON...');
    const data = await DurtNursUtils.fetchJSON('assets/data/announcements.json');

    console.log(`✅ Successfully loaded ${data.announcements.length} announcements`);
    return data.announcements;

  } catch (error) {
    console.error('❌ Error fetching announcements:', error);

    // Try to display error in whichever container is present
    const containerId = document.getElementById('homepage-news') ? 'homepage-news' : 'news-archive';
    DurtNursUtils.displayError(containerId, 'Unable to load announcements. Please try again later.');

    return [];
  }
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Maps link text to message type parameter
 * Converts announcement link text to URL parameter for message.html
 *
 * This function creates the mapping between what the user sees
 * (e.g., "Pre-order Album") and the URL parameter (e.g., "pre-order")
 * used to select the appropriate humorous message.
 *
 * @param {string} linkText - The link text from the announcement
 * @returns {string} The message type parameter for the URL
 */
function getLinkTypeFromText(linkText) {
  // Convert to lowercase and remove special characters for matching
  const normalized = linkText.toLowerCase().trim();

  // Map known link text patterns to message types
  // These correspond to the MESSAGE_CONFIG in message.js
  if (normalized.includes('pre-order') || normalized.includes('preorder')) {
    return 'pre-order';
  }
  if (normalized.includes('tour') || normalized.includes('dates')) {
    return 'tour-dates';
  }
  if (normalized.includes('spotify') || normalized.includes('listen')) {
    return 'spotify';
  }

  // Default to 'read-more' for any other text
  // This includes "Read More →" and any future variations
  return 'read-more';
}

/**
 * Generates HTML for a single announcement card
 * Uses BEM naming convention for CSS classes
 *
 * BEM (Block Element Modifier) is a naming methodology that helps create
 * reusable components and improves code maintainability:
 * - Block: announcement-card (main component)
 * - Element: announcement-card__title (part of the component)
 * - Modifier: announcement-card--news (variation of the component)
 *
 * @param {Object} announcement - Announcement data object
 * @param {boolean} isHomepage - Whether this is for the homepage (affects structure)
 * @returns {string} HTML string for the card
 */
function renderAnnouncementCard(announcement, isHomepage = false) {
  // Destructure the announcement object to extract properties
  // This is cleaner than writing announcement.title, announcement.date, etc.
  const { id, date, title, category, excerpt, content, link, featured } = announcement;

  // Format the date for display
  const formattedDate = DurtNursUtils.formatDate(date);

  // Determine the link text
  // For homepage, always show "Read More →"
  // For archive page, use the link text from data or default to "Read More →"
  const linkText = isHomepage ? 'Read More →' : (link?.text || 'Read More →');

  // Determine the link URL
  // All announcement links now point to message.html with appropriate type parameter
  // This creates the humorous dead-end experience described in Phase 10
  let linkUrl;
  if (isHomepage) {
    // Homepage links always go to read-more message
    linkUrl = 'message.html?type=read-more';
  } else {
    // Archive page links map to specific message types based on link text
    const messageType = getLinkTypeFromText(linkText);
    linkUrl = `message.html?type=${messageType}`;
  }

  // Build category modifier class for styling
  // This allows different colors/styles per category
  const categoryClass = `announcement-card--${category}`;

  // Build featured class if applicable
  const featuredClass = featured ? ' announcement-card--featured' : '';

  // Generate HTML using template literals
  // Template literals make it easy to create multi-line strings with embedded variables
  // We use ${variable} syntax to insert values
  return `
    <article class="announcement-card ${categoryClass}${featuredClass}" id="${id}">
      <header class="announcement-card__header">
        <time class="announcement-card__date" datetime="${date}">
          ${formattedDate}
        </time>
        <span class="announcement-card__category" aria-label="Category: ${category}">
          ${category}
        </span>
      </header>

      <h3 class="announcement-card__title">${title}</h3>

      ${isHomepage ?
        `<p class="announcement-card__excerpt">${excerpt}</p>` :
        `<div class="announcement-card__content">${content}</div>`
      }

      <a href="${linkUrl}" class="announcement-card__link" aria-label="Read more about ${title}">
        ${linkText}
      </a>
    </article>
  `;
}

// =============================================================================
// HOMEPAGE RENDERING
// =============================================================================

/**
 * Renders the 3 most recent announcements on the homepage
 * This function is called when the homepage loads
 *
 * DOM (Document Object Model) manipulation is how JavaScript interacts
 * with HTML. We use methods like getElementById and innerHTML to
 * change what appears on the page.
 */
async function renderHomepageNews() {
  console.log('🏠 Rendering homepage news...');

  // Get the container element where announcements will be inserted
  // getElementById is the fastest way to find an element by its ID
  const container = document.getElementById('homepage-news');

  // Defensive programming: check if the element exists
  // This prevents errors if the HTML structure changes
  if (!container) {
    console.warn('⚠️ Homepage news container not found');
    return;
  }

  // Fetch all announcements from JSON
  const announcements = await fetchAnnouncements();

  // If no announcements were loaded (error occurred), exit early
  if (announcements.length === 0) {
    return;
  }

  // Get the first 3 announcements using slice()
  // slice(start, end) creates a new array with elements from start to end (exclusive)
  // slice(0, 3) gets elements at index 0, 1, and 2
  const recentAnnouncements = announcements.slice(0, 3);

  console.log(`📰 Displaying ${recentAnnouncements.length} recent announcements`);

  // Generate HTML for each announcement using map()
  // map() transforms each item in an array and returns a new array
  // Here we transform announcement objects into HTML strings
  const cardsHTML = recentAnnouncements
    .map(announcement => renderAnnouncementCard(announcement, true))
    .join(''); // join('') combines all HTML strings into one string

  // Insert the generated HTML into the page
  // innerHTML replaces the container's content with new HTML
  // This is efficient for batch updates but be careful with user-generated content (XSS risk)
  container.innerHTML = `
    <div class="news-grid">
      ${cardsHTML}
    </div>
  `;

  console.log('✅ Homepage news rendered successfully');
}

// =============================================================================
// NEWS ARCHIVE RENDERING
// =============================================================================

/**
 * Renders all announcements on the news archive page
 * Includes optional filtering by category (future enhancement)
 *
 * @param {string|null} filterCategory - Optional category to filter by
 */
async function renderNewsArchive(filterCategory = null) {
  console.log('📚 Rendering news archive...');

  // Get the container element for the archive
  const container = document.getElementById('news-archive');

  if (!container) {
    console.warn('⚠️ News archive container not found');
    return;
  }

  // Show a loading message while fetching data
  // This improves perceived performance
  container.innerHTML = '<p class="loading-message">Loading announcements...</p>';

  // Fetch all announcements
  let announcements = await fetchAnnouncements();

  if (announcements.length === 0) {
    return;
  }

  // Apply category filter if specified
  // filter() creates a new array with only items that pass the test
  if (filterCategory) {
    announcements = announcements.filter(
      announcement => announcement.category === filterCategory
    );
    console.log(`🔍 Filtered to ${announcements.length} ${filterCategory} announcements`);
  }

  // Generate HTML for all announcements
  // For archive page, we show full content (isHomepage = false)
  const cardsHTML = announcements
    .map(announcement => renderAnnouncementCard(announcement, false))
    .join('');

  // Insert into page with grid layout
  container.innerHTML = `
    <div class="news-archive__grid">
      ${cardsHTML}
    </div>
  `;

  console.log(`✅ Archive rendered with ${announcements.length} announcements`);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the appropriate rendering function based on current page
 * This function is called when the page loads
 *
 * We detect which page we're on by checking for specific element IDs
 * This is a simple but effective way to handle different page behaviors
 */
function init() {
  console.log('🚀 Initializing announcements module...');

  // Check if we're on the homepage
  // querySelector is a flexible way to find elements using CSS selectors
  if (document.getElementById('homepage-news')) {
    console.log('📍 Detected homepage');
    renderHomepageNews();
  }

  // Check if we're on the news archive page
  else if (document.getElementById('news-archive')) {
    console.log('📍 Detected news archive page');
    renderNewsArchive();
  }

  else {
    console.log('ℹ️ No announcement containers found on this page');
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded before running code
DurtNursUtils.onDOMReady(init);

// =============================================================================
// EXPORTS (for potential future module usage)
// =============================================================================

/**
 * Export functions for use in other scripts if needed
 * This uses ES6 module syntax, which may require a build step or native browser support
 * For now, these are available globally through the script tag
 */
// Uncomment if using ES6 modules:
// export { fetchAnnouncements, renderAnnouncementCard, renderHomepageNews, renderNewsArchive, formatDate };
