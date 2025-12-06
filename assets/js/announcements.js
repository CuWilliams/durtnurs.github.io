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
 *
 * The Fetch API is a modern way to make HTTP requests in JavaScript.
 * It returns a Promise, which represents a value that will be available in the future.
 * We use async/await syntax to work with Promises in a more readable way.
 *
 * @returns {Promise<Array>} Array of announcement objects
 */
async function fetchAnnouncements() {
  try {
    // fetch() sends an HTTP request to get the JSON file
    // It returns a Promise that resolves to a Response object
    console.log('📡 Fetching announcements from JSON...');
    const response = await fetch('assets/data/announcements.json');

    // Check if the HTTP request was successful (status code 200-299)
    // If not, throw an error to be caught by our catch block
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // .json() parses the response body as JSON
    // This also returns a Promise, so we await it
    const data = await response.json();

    console.log(`✅ Successfully loaded ${data.announcements.length} announcements`);

    // Return the announcements array from the parsed JSON
    return data.announcements;

  } catch (error) {
    // If anything goes wrong (network error, invalid JSON, etc.)
    // we catch the error here and log it
    console.error('❌ Error fetching announcements:', error);

    // Display a user-friendly error message in the UI
    displayError('Unable to load announcements. Please try again later.');

    // Return empty array so the rest of the code doesn't break
    return [];
  }
}

/**
 * Displays an error message to the user
 * This is called when we can't load the announcements data
 *
 * @param {string} message - Error message to display
 */
function displayError(message) {
  // Find the container where announcements should appear
  const container = document.getElementById('homepage-news') ||
                   document.getElementById('news-archive');

  if (container) {
    // Create error message HTML using template literals
    // Template literals (backticks) allow multi-line strings and variable interpolation
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
 * Converts ISO date string (YYYY-MM-DD) to readable format (Month Day, Year)
 * Example: "2024-11-15" becomes "November 15, 2024"
 *
 * The Date object is JavaScript's built-in way to work with dates.
 * We use Intl.DateTimeFormat for locale-aware date formatting.
 *
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
function formatDate(isoDate) {
  // Create a Date object from the ISO string
  // The Date constructor can parse ISO format automatically
  const date = new Date(isoDate);

  // Intl.DateTimeFormat provides locale-aware date formatting
  // 'en-US' specifies American English formatting
  // The options object specifies how to format the date
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',   // Full year (2024)
    month: 'long',     // Full month name (November)
    day: 'numeric'     // Day without leading zero (15)
  });

  return formatter.format(date);
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
  const formattedDate = formatDate(date);

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

/**
 * Wait for the DOM to be fully loaded before running our code
 *
 * DOMContentLoaded fires when the HTML document has been completely parsed
 * and all deferred scripts have executed. This ensures all elements exist
 * before we try to manipulate them.
 *
 * We could also place our script at the end of <body>, but this is more explicit.
 */
if (document.readyState === 'loading') {
  // DOM is still loading, wait for the DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded (script was loaded late), run immediately
  init();
}

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
