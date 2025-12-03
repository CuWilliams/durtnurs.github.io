/**
 * FAN CLUB GALLERY MODULE
 * Displays FULL gallery (all media items) for authenticated Fan Club members
 *
 * This module demonstrates:
 * - Code reuse and DRY principle
 * - When to duplicate vs abstract code
 * - Array handling without filtering
 * - Same lightbox functionality as public gallery
 * - Educational comments about design decisions
 *
 * KEY DIFFERENCE FROM PUBLIC GALLERY:
 * ===================================
 * This module displays ALL media items from gallery.json, regardless of "public" flag.
 *
 * Public Gallery (gallery.js):
 * - Filters media array: media.filter(item => item.public === true)
 * - Shows only curated, public-facing content
 * - Anyone can access
 *
 * Fan Club Gallery (this file):
 * - NO filtering: displays complete media array
 * - Shows behind-the-scenes, exclusive content
 * - Requires access code authentication
 *
 * WHY DUPLICATE CODE?
 * ===================
 * You might notice this file shares a lot of code with gallery.js.
 * In a production app, we might abstract common functionality into shared utilities.
 * However, for this learning project, duplication has benefits:
 *
 * Benefits of duplication here:
 * - Clear separation of concerns (public vs private galleries)
 * - Easy to modify one without affecting the other
 * - Complete code in each file makes learning easier
 * - No complex abstraction layer to understand
 *
 * When to abstract instead:
 * - If maintaining multiple similar galleries
 * - If lightbox code changes frequently
 * - If gallery logic becomes more complex
 * - In larger production applications
 *
 * This is a pragmatic choice for a small project.
 */

// =============================================================================
// GLOBAL STATE
// =============================================================================

/**
 * Global state object to track lightbox navigation
 * Shared with lightbox functionality for current image tracking
 */
let fanclubGalleryState = {
  allMedia: [],           // FULL array of ALL media items (no filtering)
  currentIndex: 0,        // Index of currently displayed item in lightbox
  isLightboxOpen: false   // Track lightbox state for keyboard handler
};

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches gallery media data from JSON file
 *
 * Same fetch logic as public gallery - we load the same data source.
 * The difference is in how we use it (show all vs show only public).
 *
 * @returns {Promise<Array>} Array of ALL media objects
 */
async function fetchAllGalleryMedia() {
  try {
    console.log('📡 Fetching FULL gallery media for Fan Club...');
    const response = await fetch('assets/data/gallery.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Log the TOTAL count (including non-public items)
    console.log(`✅ Successfully loaded ${data.media.length} media items (all items, including private)`);

    return data.media;

  } catch (error) {
    console.error('❌ Error fetching gallery media:', error);
    displayError('Unable to load Fan Club gallery. Please try again later.');
    return [];
  }
}

/**
 * Displays an error message to the user
 *
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const container = document.getElementById('fanclub-gallery-grid');

  if (container) {
    container.innerHTML = `
      <div class="error-message" role="alert">
        <p><strong>Oops!</strong> ${message}</p>
      </div>
    `;
  }
}

// =============================================================================
// SORTING (No Filtering!)
// =============================================================================

/**
 * Sorts media array by featured status, then by date (newest first)
 *
 * IMPORTANT: This does NOT filter by public flag!
 * ALL items are included, regardless of public status.
 *
 * Sorting strategy:
 * 1. Featured items appear first (featured: true)
 * 2. Within each group, sort by date (newest first)
 *
 * @param {Array} media - Array of ALL media items to sort
 * @returns {Array} Sorted array
 */
function sortAllMedia(media) {
  return media.sort((a, b) => {
    // First, sort by featured status
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // If both have same featured status, sort by date (newest first)
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
 * Uses same BEM structure as public gallery for consistent styling
 *
 * @param {Object} mediaItem - Media data object
 * @param {number} index - Index in array (for lightbox navigation)
 * @returns {string} HTML string for the card
 */
function renderMediaCard(mediaItem, index) {
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
    featured,
    public: isPublic  // Destructure but we don't use it to filter!
  } = mediaItem;

  const formattedDate = formatDate(date);
  const featuredClass = featured ? ' gallery-card--featured' : '';

  // Add a visual indicator for items that are Fan Club exclusive (not public)
  // This helps members understand which content is special/exclusive
  const exclusiveBadge = !isPublic ? '<span class="fanclub-exclusive-badge" aria-label="Fan Club Exclusive">★ Exclusive</span>' : '';

  const thumbnailPath = type === 'photo'
    ? `assets/images/gallery/${thumbnail}`
    : `assets/images/gallery/${thumbnail}`;

  const dataType = type === 'video' ? 'video' : 'photo';

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
        ${exclusiveBadge}
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
 * Renders FULL gallery to the Fan Club page
 *
 * KEY DIFFERENCE: This function displays ALL media items.
 * No filtering by public flag occurs!
 *
 * Compare to public gallery:
 * - Public gallery: filters before rendering
 * - Fan Club gallery: renders everything
 *
 * @param {Array} allMedia - Array of ALL media items to render
 */
async function renderFullGallery(allMedia) {
  console.log('🖼️ Rendering FULL Fan Club gallery...');

  const container = document.getElementById('fanclub-gallery-grid');

  if (!container) {
    console.warn('⚠️ Fan Club gallery container not found');
    return;
  }

  // Show loading message
  container.innerHTML = '<p class="loading-message">Loading full gallery...</p>';

  // Fetch media data if not provided
  if (!allMedia || allMedia.length === 0) {
    allMedia = await fetchAllGalleryMedia();

    if (allMedia.length === 0) {
      return; // Error already displayed by fetchAllGalleryMedia
    }
  }

  // Sort media (but don't filter!)
  // We create a copy with [...allMedia] to avoid mutating the original
  const sortedMedia = sortAllMedia([...allMedia]);

  console.log(`📸 Rendering ${sortedMedia.length} media items (FULL gallery - no filtering)`);

  // Count how many are exclusive (not public)
  const exclusiveCount = sortedMedia.filter(item => !item.public).length;
  console.log(`⭐ ${exclusiveCount} exclusive items (not in public gallery)`);

  // Generate HTML for each media card
  const cardsHTML = sortedMedia
    .map((item, index) => renderMediaCard(item, index))
    .join('');

  // Insert generated HTML into the page
  container.innerHTML = cardsHTML;

  // Store media array in global state for lightbox navigation
  fanclubGalleryState.allMedia = sortedMedia;

  // Initialize lightbox click handlers
  initLightbox();

  console.log('✅ Full Fan Club gallery rendered successfully');
}

// =============================================================================
// LIGHTBOX FUNCTIONALITY
// =============================================================================

/**
 * Initializes lightbox click handlers on all gallery cards
 * Uses event delegation for performance
 */
function initLightbox() {
  const container = document.getElementById('fanclub-gallery-grid');

  if (!container) return;

  // Add click listener to container
  container.addEventListener('click', handleCardClick);

  // Add keyboard listener for accessibility
  container.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e);
    }
  });

  console.log('🔍 Fan Club lightbox initialized');
}

/**
 * Handles click on gallery card
 *
 * @param {Event} event - Click event object
 */
function handleCardClick(event) {
  const card = event.target.closest('.gallery-card');
  if (!card) return;

  const index = parseInt(card.dataset.index, 10);

  if (isNaN(index)) {
    console.warn('⚠️ Card missing data-index attribute');
    return;
  }

  openLightbox(index);
}

/**
 * Opens lightbox with specified media item
 *
 * @param {number} index - Index of media item in fanclubGalleryState.allMedia array
 */
function openLightbox(index) {
  fanclubGalleryState.currentIndex = index;
  fanclubGalleryState.isLightboxOpen = true;

  const mediaItem = fanclubGalleryState.allMedia[index];

  if (!mediaItem) {
    console.warn(`⚠️ No media item at index ${index}`);
    return;
  }

  console.log(`🔍 Opening lightbox for: ${mediaItem.title}`);

  let lightbox = document.getElementById('lightbox');

  if (!lightbox) {
    lightbox = createLightboxStructure();
  }

  renderLightboxContent(mediaItem);

  lightbox.classList.add('lightbox--active');
  document.body.style.overflow = 'hidden';

  const closeBtn = lightbox.querySelector('.lightbox__close');
  if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 100);
  }

  initKeyboardNav();
}

/**
 * Creates lightbox DOM structure
 *
 * @returns {HTMLElement} Lightbox container element
 */
function createLightboxStructure() {
  console.log('🔨 Creating lightbox structure...');

  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Media viewer');

  lightbox.innerHTML = `
    <button class="lightbox__close"
            aria-label="Close lightbox"
            title="Close (ESC)">
      ×
    </button>

    <button class="lightbox__prev"
            aria-label="Previous image"
            title="Previous (Left Arrow)">
      ←
    </button>

    <button class="lightbox__next"
            aria-label="Next image"
            title="Next (Right Arrow)">
      →
    </button>

    <div class="lightbox__content">
      <!-- Media content gets inserted here -->
    </div>

    <div class="lightbox__counter" aria-live="polite">
      <!-- Counter text gets inserted here -->
    </div>
  `;

  document.body.appendChild(lightbox);

  attachLightboxListeners(lightbox);

  return lightbox;
}

/**
 * Attaches event listeners to lightbox buttons
 *
 * @param {HTMLElement} lightbox - Lightbox container element
 */
function attachLightboxListeners(lightbox) {
  const closeBtn = lightbox.querySelector('.lightbox__close');
  closeBtn.addEventListener('click', closeLightbox);

  const prevBtn = lightbox.querySelector('.lightbox__prev');
  prevBtn.addEventListener('click', showPrevious);

  const nextBtn = lightbox.querySelector('.lightbox__next');
  nextBtn.addEventListener('click', showNext);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
}

/**
 * Renders media content in lightbox
 *
 * @param {Object} mediaItem - Media data object
 */
function renderLightboxContent(mediaItem) {
  const lightbox = document.getElementById('lightbox');
  const contentContainer = lightbox.querySelector('.lightbox__content');
  const counterContainer = lightbox.querySelector('.lightbox__counter');

  contentContainer.innerHTML = '';

  if (mediaItem.type === 'photo') {
    const img = document.createElement('img');
    img.src = `assets/images/gallery/${mediaItem.filename}`;
    img.alt = mediaItem.title;
    img.className = 'lightbox__image';

    img.onerror = function() {
      this.src = 'assets/images/logo.png';
      this.alt = 'Image unavailable';
    };

    contentContainer.appendChild(img);

  } else if (mediaItem.type === 'video') {
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

  // Add exclusive badge if item is not public
  const exclusiveBadge = !mediaItem.public ? '<span class="lightbox-exclusive-badge">★ Fan Club Exclusive</span>' : '';

  infoDiv.innerHTML = `
    ${exclusiveBadge}
    <h3 class="lightbox__title">${mediaItem.title}</h3>
    <p class="lightbox__description">${mediaItem.description}</p>
  `;
  contentContainer.appendChild(infoDiv);

  // Update counter
  const current = fanclubGalleryState.currentIndex + 1;
  const total = fanclubGalleryState.allMedia.length;
  counterContainer.textContent = `${current} / ${total}`;

  updateNavigationButtons();
}

/**
 * Updates visibility of prev/next buttons
 */
function updateNavigationButtons() {
  const lightbox = document.getElementById('lightbox');
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  const nextBtn = lightbox.querySelector('.lightbox__next');

  if (fanclubGalleryState.currentIndex === 0) {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.pointerEvents = 'none';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
  }

  if (fanclubGalleryState.currentIndex === fanclubGalleryState.allMedia.length - 1) {
    nextBtn.style.opacity = '0.3';
    nextBtn.style.pointerEvents = 'none';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
  }
}

/**
 * Closes lightbox
 */
function closeLightbox() {
  console.log('❌ Closing lightbox');

  const lightbox = document.getElementById('lightbox');

  if (lightbox) {
    lightbox.classList.remove('lightbox--active');
    document.body.style.overflow = '';
  }

  fanclubGalleryState.isLightboxOpen = false;
  document.removeEventListener('keydown', handleKeyboardNav);
}

/**
 * Shows previous image in lightbox
 */
function showPrevious() {
  if (fanclubGalleryState.currentIndex > 0) {
    openLightbox(fanclubGalleryState.currentIndex - 1);
  }
}

/**
 * Shows next image in lightbox
 */
function showNext() {
  if (fanclubGalleryState.currentIndex < fanclubGalleryState.allMedia.length - 1) {
    openLightbox(fanclubGalleryState.currentIndex + 1);
  }
}

// =============================================================================
// KEYBOARD NAVIGATION
// =============================================================================

/**
 * Initializes keyboard navigation for lightbox
 */
function initKeyboardNav() {
  document.addEventListener('keydown', handleKeyboardNav);
}

/**
 * Handles keyboard events for lightbox navigation
 *
 * @param {KeyboardEvent} event - Keyboard event object
 */
function handleKeyboardNav(event) {
  if (!fanclubGalleryState.isLightboxOpen) return;

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
      break;
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the Fan Club gallery module
 * Detects container and renders full gallery
 */
function init() {
  console.log('🚀 Initializing Fan Club gallery module...');

  // Check if we're on the Fan Club page
  if (document.getElementById('fanclub-gallery-grid')) {
    console.log('📍 Detected Fan Club gallery page');
    console.log('⭐ Rendering FULL gallery (no public flag filtering)');
    renderFullGallery();
  } else {
    console.log('ℹ️ No Fan Club gallery container found on this page');
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

/**
 * Wait for DOM to be fully loaded before running code
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// =============================================================================
// DEVELOPER CONSOLE MESSAGE
// =============================================================================

console.log('%c⭐ Fan Club Gallery Module Loaded', 'font-size: 14px; font-weight: bold; color: #A05A24;');
console.log('%cThis module displays ALL media items (no public flag filtering)', 'color: #8B7A43;');
console.log('%cCompare gallery.js (filters public:true) vs this file (shows all)', 'color: #A8A29E;');
