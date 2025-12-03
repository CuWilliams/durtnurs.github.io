/**
 * GALLERY MODULE
 * Handles dynamic loading and rendering of photo/video gallery from JSON
 *
 * This module demonstrates:
 * - Fetch API for loading external JSON data
 * - Array filtering (public vs. Fan Club content)
 * - Template literals for clean HTML generation
 * - DOM manipulation for dynamic content
 * - Custom lightbox implementation (no external libraries)
 * - Keyboard navigation (arrow keys, ESC)
 * - Event delegation for performance
 * - Progressive enhancement (works alongside static HTML fallback)
 * - Error handling with try/catch
 * - Date formatting with Intl API
 *
 * DUAL GALLERY SYSTEM:
 * This module supports both:
 * - PUBLIC GALLERY (gallery.html): Shows only items with "public": true
 * - FAN CLUB GALLERY (fanclub.html): Shows all items (Phase 6)
 *
 * The filtering happens in filterPublicMedia() function.
 */

// =============================================================================
// GLOBAL STATE
// =============================================================================

/**
 * Global state object to track lightbox navigation
 *
 * Why global state?
 * - Lightbox navigation needs to know current position in media array
 * - Keyboard handlers need access to this data
 * - Alternative would be data attributes, but this is cleaner
 */
let galleryState = {
  allMedia: [],           // Full array of media items
  currentIndex: 0,        // Index of currently displayed item in lightbox
  isLightboxOpen: false   // Track lightbox state for keyboard handler
};

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches gallery media data from JSON file
 *
 * The Fetch API is a modern interface for making HTTP requests.
 * It returns a Promise, representing an asynchronous operation.
 * We use async/await syntax to handle Promises more readably.
 *
 * @returns {Promise<Array>} Array of media objects
 */
async function fetchGalleryMedia() {
  try {
    console.log('📡 Fetching gallery media from JSON...');
    const response = await fetch('assets/data/gallery.json');

    // Check HTTP response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse response body as JSON
    const data = await response.json();

    console.log(`✅ Successfully loaded ${data.media.length} media items`);

    // Return the media array from the parsed data
    return data.media;

  } catch (error) {
    // Catch any errors: network failures, invalid JSON, 404s, etc.
    console.error('❌ Error fetching gallery media:', error);

    // Display user-friendly error message in UI
    displayError('Unable to load gallery. Please try again later.');

    // Return empty array so rest of code doesn't break
    return [];
  }
}

/**
 * Displays an error message to the user
 * Called when gallery data cannot be loaded
 *
 * @param {string} message - Error message to display
 */
function displayError(message) {
  // Find the container where gallery should appear
  const container = document.getElementById('gallery-grid');

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
// FILTERING
// =============================================================================

/**
 * Filters media array to show only public items
 *
 * This is the KEY function for the dual gallery system.
 *
 * PUBLIC GALLERY (gallery.html):
 * - Calls this function to show only public:true items
 * - Curated, family-friendly content
 *
 * FAN CLUB GALLERY (fanclub.html - Phase 6):
 * - Skips this function to show ALL items
 * - Behind-the-scenes, exclusive content
 *
 * Array.filter() creates a new array containing only items that pass the test.
 * Original array remains unchanged (immutability principle).
 *
 * @param {Array} media - Full array of media items
 * @returns {Array} Filtered array containing only public items
 */
function filterPublicMedia(media) {
  // Filter using arrow function
  // item => item.public === true reads as:
  // "for each item, return true if item.public is true"
  const publicMedia = media.filter(item => item.public === true);

  console.log(`🔍 Filtered ${media.length} items to ${publicMedia.length} public items`);

  return publicMedia;
}

/**
 * Sorts media array by featured status, then by date (newest first)
 *
 * Sorting strategy:
 * 1. Featured items appear first (featured: true)
 * 2. Within each group (featured/non-featured), sort by date (newest first)
 *
 * @param {Array} media - Array of media items to sort
 * @returns {Array} Sorted array (original array is modified)
 */
function sortMedia(media) {
  return media.sort((a, b) => {
    // First, sort by featured status
    // If a is featured but b isn't, a comes first (return -1)
    // If b is featured but a isn't, b comes first (return 1)
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // If both have same featured status, sort by date (newest first)
    // Convert ISO date strings to Date objects, then subtract
    // b - a sorts descending (newest first)
    return new Date(b.date) - new Date(a.date);
  });
}

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Converts ISO date string to readable format
 * Example: "2024-10-15" becomes "October 15, 2024"
 *
 * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return formatter.format(date);
}

// =============================================================================
// HTML GENERATION FOR GALLERY CARDS
// =============================================================================

/**
 * Generates HTML for a single media card
 * Uses BEM naming convention for CSS classes
 *
 * BEM Structure:
 * - Block: .gallery-card
 * - Elements: .gallery-card__thumbnail, .gallery-card__title, etc.
 * - Modifiers: .gallery-card--featured (for featured items)
 *
 * @param {Object} mediaItem - Media data object
 * @param {number} index - Index in array (for lightbox navigation)
 * @returns {string} HTML string for the card
 */
function renderMediaCard(mediaItem, index) {
  // Destructure media object for cleaner code
  const {
    id,
    type,
    title,
    description,
    filename,
    thumbnail,
    embedUrl,
    date,
    category,
    featured
  } = mediaItem;

  // Format date for display
  const formattedDate = formatDate(date);

  // Build modifier classes
  const featuredClass = featured ? ' gallery-card--featured' : '';

  // Build thumbnail path
  // Photos use thumbnail images, videos use thumbnail images with play icon overlay
  const thumbnailPath = type === 'photo'
    ? `assets/images/gallery/${thumbnail}`
    : `assets/images/gallery/${thumbnail}`;

  // Determine if this is a photo or video for styling and behavior
  const dataType = type === 'video' ? 'video' : 'photo';

  // Return complete card HTML
  // Card is clickable and opens lightbox on click
  // data-index attribute stores position for lightbox navigation
  return `
    <article class="gallery-card${featuredClass}"
             id="${id}"
             data-type="${dataType}"
             data-index="${index}"
             role="button"
             tabindex="0"
             aria-label="View ${title}">

      <!-- Thumbnail Image -->
      <div class="gallery-card__thumbnail-wrapper">
        <img src="${thumbnailPath}"
             alt="${title}"
             class="gallery-card__thumbnail"
             loading="lazy"
             onerror="this.src='assets/images/logo.png'; this.alt='Image unavailable';">

        <!-- Play icon overlay for videos -->
        ${type === 'video' ? '<span class="gallery-card__play-icon" aria-hidden="true">▶</span>' : ''}
      </div>

      <!-- Card Content -->
      <div class="gallery-card__content">
        <h3 class="gallery-card__title">${title}</h3>
        <p class="gallery-card__description">${description}</p>
        <time class="gallery-card__date" datetime="${date}">
          ${formattedDate}
        </time>
      </div>

    </article>
  `;
}

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

/**
 * Renders gallery to the page
 * Called for both public gallery (gallery.html) and Fan Club gallery (Phase 6)
 *
 * @param {Array} media - Array of media items to render
 * @param {string} containerId - ID of container element
 */
async function renderGallery(media, containerId) {
  console.log(`🖼️ Rendering gallery to #${containerId}...`);

  // Find the grid container element
  const container = document.getElementById(containerId);

  // Defensive check: ensure element exists
  if (!container) {
    console.warn(`⚠️ Gallery container #${containerId} not found`);
    return;
  }

  // Show loading message while fetching data
  container.innerHTML = '<p class="loading-message">Loading gallery...</p>';

  // Fetch media data if not provided
  if (!media || media.length === 0) {
    media = await fetchGalleryMedia();

    // Exit early if no media loaded (error occurred)
    if (media.length === 0) {
      return;
    }
  }

  // Sort media by featured status and date
  const sortedMedia = sortMedia([...media]); // [...media] creates copy to avoid mutating original

  console.log(`📸 Rendering ${sortedMedia.length} media items`);

  // Generate HTML for each media card
  const cardsHTML = sortedMedia
    .map((item, index) => renderMediaCard(item, index))
    .join('');

  // Insert generated HTML into the page
  container.innerHTML = cardsHTML;

  // Store media array in global state for lightbox navigation
  galleryState.allMedia = sortedMedia;

  // Initialize lightbox click handlers
  initLightbox();

  console.log('✅ Gallery rendered successfully');
}

/**
 * Renders PUBLIC gallery (filters for public items only)
 * This is the main function called by gallery.html
 */
async function renderPublicGallery() {
  console.log('🎨 Rendering PUBLIC gallery...');

  // Fetch all media
  let allMedia = await fetchGalleryMedia();

  // Exit early if no media loaded
  if (allMedia.length === 0) {
    return;
  }

  // Filter for public items only
  const publicMedia = filterPublicMedia(allMedia);

  // Render filtered media
  renderGallery(publicMedia, 'gallery-grid');
}

// =============================================================================
// LIGHTBOX FUNCTIONALITY
// =============================================================================

/**
 * Initializes lightbox click handlers on all gallery cards
 *
 * Uses EVENT DELEGATION for performance:
 * - Instead of adding click listener to each card (expensive)
 * - Add ONE listener to parent container (efficient)
 * - Use event.target to determine which card was clicked
 *
 * Why event delegation?
 * - Better performance (fewer event listeners)
 * - Works with dynamically added elements
 * - Less memory usage
 */
function initLightbox() {
  const container = document.getElementById('gallery-grid');

  if (!container) return;

  // Add click listener to container
  container.addEventListener('click', handleCardClick);

  // Add keyboard listener for accessibility
  // Users can press Enter on focused card to open lightbox
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e);
    }
  });

  console.log('🔍 Lightbox initialized');
}

/**
 * Handles click on gallery card
 * Determines which card was clicked and opens lightbox
 *
 * @param {Event} event - Click event object
 */
function handleCardClick(event) {
  // Find closest gallery card element
  // .closest() searches up the DOM tree to find matching element
  // This handles clicks on child elements (image, text, etc.)
  const card = event.target.closest('.gallery-card');

  if (!card) return;

  // Get index from data attribute
  // This tells us which item to show in lightbox
  const index = parseInt(card.dataset.index, 10);

  if (isNaN(index)) {
    console.warn('⚠️ Card missing data-index attribute');
    return;
  }

  // Open lightbox with this item
  openLightbox(index);
}

/**
 * Opens lightbox with specified media item
 * Creates and displays lightbox overlay with image/video
 *
 * @param {number} index - Index of media item in galleryState.allMedia array
 */
function openLightbox(index) {
  // Update global state
  galleryState.currentIndex = index;
  galleryState.isLightboxOpen = true;

  // Get media item
  const mediaItem = galleryState.allMedia[index];

  if (!mediaItem) {
    console.warn(`⚠️ No media item at index ${index}`);
    return;
  }

  console.log(`🔍 Opening lightbox for: ${mediaItem.title}`);

  // Get or create lightbox container
  let lightbox = document.getElementById('lightbox');

  if (!lightbox) {
    // Create lightbox structure if it doesn't exist
    lightbox = createLightboxStructure();
  }

  // Render media content in lightbox
  renderLightboxContent(mediaItem);

  // Show lightbox
  lightbox.classList.add('lightbox--active');

  // Prevent body scrolling when lightbox is open
  document.body.style.overflow = 'hidden';

  // Set focus to close button for keyboard accessibility
  const closeBtn = lightbox.querySelector('.lightbox__close');
  if (closeBtn) {
    // Small delay ensures lightbox is visible before focusing
    setTimeout(() => closeBtn.focus(), 100);
  }

  // Initialize keyboard navigation
  initKeyboardNav();
}

/**
 * Creates lightbox DOM structure
 * Called once on first lightbox open
 *
 * @returns {HTMLElement} Lightbox container element
 */
function createLightboxStructure() {
  console.log('🔨 Creating lightbox structure...');

  // Create main lightbox container
  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Media viewer');

  // Lightbox HTML structure
  lightbox.innerHTML = `
    <!-- Close button -->
    <button class="lightbox__close"
            aria-label="Close lightbox"
            title="Close (ESC)">
      ×
    </button>

    <!-- Previous button -->
    <button class="lightbox__prev"
            aria-label="Previous image"
            title="Previous (Left Arrow)">
      ←
    </button>

    <!-- Next button -->
    <button class="lightbox__next"
            aria-label="Next image"
            title="Next (Right Arrow)">
      →
    </button>

    <!-- Content container -->
    <div class="lightbox__content">
      <!-- Media content gets inserted here -->
    </div>

    <!-- Image counter -->
    <div class="lightbox__counter" aria-live="polite">
      <!-- Counter text gets inserted here -->
    </div>
  `;

  // Add to page
  document.body.appendChild(lightbox);

  // Attach event listeners
  attachLightboxListeners(lightbox);

  return lightbox;
}

/**
 * Attaches event listeners to lightbox buttons
 *
 * @param {HTMLElement} lightbox - Lightbox container element
 */
function attachLightboxListeners(lightbox) {
  // Close button
  const closeBtn = lightbox.querySelector('.lightbox__close');
  closeBtn.addEventListener('click', closeLightbox);

  // Previous button
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  prevBtn.addEventListener('click', showPrevious);

  // Next button
  const nextBtn = lightbox.querySelector('.lightbox__next');
  nextBtn.addEventListener('click', showNext);

  // Click outside content to close
  // This improves UX - users expect this behavior
  lightbox.addEventListener('click', (e) => {
    // Only close if clicking the overlay itself, not content
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
}

/**
 * Renders media content in lightbox
 * Handles both photos and videos
 *
 * @param {Object} mediaItem - Media data object
 */
function renderLightboxContent(mediaItem) {
  const lightbox = document.getElementById('lightbox');
  const contentContainer = lightbox.querySelector('.lightbox__content');
  const counterContainer = lightbox.querySelector('.lightbox__counter');

  // Clear existing content
  contentContainer.innerHTML = '';

  // Render based on media type
  if (mediaItem.type === 'photo') {
    // Photo: Create <img> element
    const img = document.createElement('img');
    img.src = `assets/images/gallery/${mediaItem.filename}`;
    img.alt = mediaItem.title;
    img.className = 'lightbox__image';

    // Add error handler
    img.onerror = function() {
      this.src = 'assets/images/logo.png';
      this.alt = 'Image unavailable';
    };

    contentContainer.appendChild(img);

  } else if (mediaItem.type === 'video') {
    // Video: Create <iframe> for YouTube embed
    const iframe = document.createElement('iframe');
    iframe.src = mediaItem.embedUrl;
    iframe.className = 'lightbox__video';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'true');

    contentContainer.appendChild(iframe);
  }

  // Add title and description
  const infoDiv = document.createElement('div');
  infoDiv.className = 'lightbox__info';
  infoDiv.innerHTML = `
    <h3 class="lightbox__title">${mediaItem.title}</h3>
    <p class="lightbox__description">${mediaItem.description}</p>
  `;
  contentContainer.appendChild(infoDiv);

  // Update counter
  const current = galleryState.currentIndex + 1;
  const total = galleryState.allMedia.length;
  counterContainer.textContent = `${current} / ${total}`;

  // Show/hide navigation buttons
  updateNavigationButtons();
}

/**
 * Updates visibility of prev/next buttons
 * Hide prev button on first item, hide next button on last item
 */
function updateNavigationButtons() {
  const lightbox = document.getElementById('lightbox');
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  const nextBtn = lightbox.querySelector('.lightbox__next');

  // Hide prev button on first item
  if (galleryState.currentIndex === 0) {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.pointerEvents = 'none';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
  }

  // Hide next button on last item
  if (galleryState.currentIndex === galleryState.allMedia.length - 1) {
    nextBtn.style.opacity = '0.3';
    nextBtn.style.pointerEvents = 'none';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
  }
}

/**
 * Closes lightbox
 * Removes overlay and restores body scrolling
 */
function closeLightbox() {
  console.log('❌ Closing lightbox');

  const lightbox = document.getElementById('lightbox');

  if (lightbox) {
    // Remove active class (triggers CSS fade-out)
    lightbox.classList.remove('lightbox--active');

    // Restore body scrolling
    document.body.style.overflow = '';
  }

  // Update state
  galleryState.isLightboxOpen = false;

  // Remove keyboard listener
  document.removeEventListener('keydown', handleKeyboardNav);
}

/**
 * Shows previous image in lightbox
 */
function showPrevious() {
  if (galleryState.currentIndex > 0) {
    openLightbox(galleryState.currentIndex - 1);
  }
}

/**
 * Shows next image in lightbox
 */
function showNext() {
  if (galleryState.currentIndex < galleryState.allMedia.length - 1) {
    openLightbox(galleryState.currentIndex + 1);
  }
}

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * Initializes keyboard navigation for lightbox
 * Supports: ESC (close), Left Arrow (previous), Right Arrow (next)
 */
function initKeyboardNav() {
  // Add keyboard listener to document
  // This captures keyboard events globally while lightbox is open
  document.addEventListener('keydown', handleKeyboardNav);
}

/**
 * Handles keyboard events for lightbox navigation
 *
 * Supported keys:
 * - Escape: Close lightbox
 * - ArrowLeft: Previous image
 * - ArrowRight: Next image
 *
 * @param {KeyboardEvent} event - Keyboard event object
 */
function handleKeyboardNav(event) {
  // Only handle keyboard if lightbox is open
  if (!galleryState.isLightboxOpen) return;

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      closeLightbox();
      break;

    case 'ArrowLeft':
      event.preventDefault();
      showPrevious();
      break;

    case 'ArrowRight':
      event.preventDefault();
      showNext();
      break;

    default:
      // Do nothing for other keys
      break;
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the gallery module
 * Detects which page we're on and calls appropriate render function
 */
function init() {
  console.log('🚀 Initializing gallery module...');

  // Check if we're on the public gallery page
  if (document.getElementById('gallery-grid')) {
    console.log('📍 Detected gallery page');
    renderPublicGallery();
  }
  // Future: Add check for Fan Club gallery page
  // else if (document.getElementById('fanclub-gallery-grid')) {
  //   console.log('📍 Detected Fan Club gallery page');
  //   renderFullGallery(); // Shows ALL media, no filtering
  // }
  else {
    console.log('ℹ️ No gallery containers found on this page');
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

/**
 * Wait for DOM to be fully loaded before running code
 *
 * DOMContentLoaded event fires when HTML is fully parsed.
 * This ensures all elements exist before we try to manipulate them.
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded
  init();
}

// =============================================================================
// EXPORTS (for potential future module usage)
// =============================================================================

/**
 * If using ES6 modules in the future, uncomment to export functions
 * Example: import { fetchGalleryMedia, renderGallery } from './gallery.js'
 */
// export {
//   fetchGalleryMedia,
//   filterPublicMedia,
//   renderGallery,
//   renderPublicGallery,
//   openLightbox,
//   closeLightbox
// };
