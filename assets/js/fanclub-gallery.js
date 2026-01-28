/**
 * FAN CLUB GALLERY MODULE
 * Displays FULL gallery (all media items) for authenticated Fan Club members
 *
 * This module demonstrates:
 * - Code reuse with shared lightbox module
 * - Custom content renderer for exclusive badges
 * - Array handling without filtering
 * - Same lightbox functionality as public gallery
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
 * LIGHTBOX:
 * Uses shared lightbox.js module with custom content renderer
 * that adds "Fan Club Exclusive" badges for non-public items.
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

// Lightbox instance (created during init)
let lightbox = null;

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches gallery media data from JSON file
 *
 * Uses shared DurtNursUtils.fetchJSON for HTTP requests.
 *
 * @returns {Promise<Array>} Array of ALL media objects
 */
async function fetchAllGalleryMedia() {
  try {
    DurtNursUtils.debug('📡 Fetching FULL gallery media for Fan Club...');
    const data = await DurtNursUtils.fetchJSON('/assets/data/gallery.json');

    DurtNursUtils.debug(`✅ Successfully loaded ${data.media.length} media items (all items, including private)`);
    return data.media;

  } catch (error) {
    DurtNursUtils.debugError('❌ Error fetching gallery media:', error);
    DurtNursUtils.displayError('fanclub-gallery-grid', 'Unable to load Fan Club gallery. Please try again later.');
    return [];
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

  const formattedDate = DurtNursUtils.formatDate(date);
  const featuredClass = featured ? ' gallery-card--featured' : '';

  // Add a visual indicator for items that are Fan Club exclusive (not public)
  // This helps members understand which content is special/exclusive
  const exclusiveBadge = !isPublic ? '<span class="fanclub-exclusive-badge" aria-label="Fan Club Exclusive">★ Exclusive</span>' : '';

  const thumbnailPath = type === 'photo'
    ? `/assets/images/gallery/${thumbnail}`
    : `/assets/images/gallery/${thumbnail}`;

  const dataType = type === 'video' ? 'video' : 'photo';

  // Generate thumbnail with WebP support
  const thumbnailHTML = DurtNursUtils.pictureElement({
    src: thumbnailPath,
    alt: title,
    className: 'gallery-card__thumbnail',
    loading: 'lazy',
    onerror: "this.src='/assets/images/logo.png'; this.alt='Image unavailable';"
  });

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
        ${thumbnailHTML}

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
// CUSTOM LIGHTBOX CONTENT RENDERER
// =============================================================================

/**
 * Custom content renderer for Fan Club lightbox
 * Adds "Fan Club Exclusive" badge for non-public items
 *
 * This is passed to the shared lightbox module to customize
 * how content is displayed in the lightbox.
 *
 * @param {Object} mediaItem - Media data object
 * @param {HTMLElement} contentContainer - Container for media content
 * @param {HTMLElement} counterContainer - Container for counter display
 * @param {Object} state - Current state { currentIndex, allMedia }
 */
function renderFanclubLightboxContent(mediaItem, contentContainer, counterContainer, state) {
  // Clear existing content
  contentContainer.innerHTML = '';

  // Render based on media type
  if (mediaItem.type === 'photo') {
    const img = document.createElement('img');
    img.src = `/assets/images/gallery/${mediaItem.filename}`;
    img.alt = mediaItem.title;
    img.className = 'lightbox__image';

    img.onerror = function() {
      this.src = '/assets/images/logo.png';
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

  // Add title and description with exclusive badge
  const infoDiv = document.createElement('div');
  infoDiv.className = 'lightbox__info';

  // Add exclusive badge if item is not public
  const exclusiveBadge = !mediaItem.public
    ? '<span class="lightbox-exclusive-badge">★ Fan Club Exclusive</span>'
    : '';

  infoDiv.innerHTML = `
    ${exclusiveBadge}
    <h3 class="lightbox__title">${mediaItem.title}</h3>
    <p class="lightbox__description">${mediaItem.description}</p>
  `;
  contentContainer.appendChild(infoDiv);

  // Update counter
  const current = state.currentIndex + 1;
  const total = state.allMedia.length;
  counterContainer.textContent = `${current} / ${total}`;
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
  DurtNursUtils.debug('🖼️ Rendering FULL Fan Club gallery...');

  const container = document.getElementById('fanclub-gallery-grid');

  if (!container) {
    DurtNursUtils.debugWarn('⚠️ Fan Club gallery container not found');
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

  DurtNursUtils.debug(`📸 Rendering ${sortedMedia.length} media items (FULL gallery - no filtering)`);

  // Count how many are exclusive (not public)
  const exclusiveCount = sortedMedia.filter(item => !item.public).length;
  DurtNursUtils.debug(`⭐ ${exclusiveCount} exclusive items (not in public gallery)`);

  // Generate HTML for each media card
  const cardsHTML = sortedMedia
    .map((item, index) => renderMediaCard(item, index))
    .join('');

  // Insert generated HTML into the page
  container.innerHTML = cardsHTML;

  // Store media array in global state for lightbox navigation
  fanclubGalleryState.allMedia = sortedMedia;

  // Initialize lightbox with custom content renderer
  initLightbox();

  DurtNursUtils.debug('✅ Full Fan Club gallery rendered successfully');
}

// =============================================================================
// LIGHTBOX INITIALIZATION
// =============================================================================

/**
 * Initializes lightbox using shared lightbox.js module
 * Uses custom content renderer for exclusive badge support
 */
function initLightbox() {
  // Create lightbox instance using shared module
  lightbox = window.createLightbox({
    containerId: 'fanclub-gallery-grid',
    getState: () => fanclubGalleryState,
    setState: (updates) => Object.assign(fanclubGalleryState, updates),
    // Custom renderer that adds exclusive badges
    renderContent: renderFanclubLightboxContent
  });

  // Initialize click handlers
  lightbox.init();

  DurtNursUtils.debug('🔍 Fan Club lightbox initialized');
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the Fan Club gallery module
 * Detects container and renders full gallery
 */
function init() {
  DurtNursUtils.debug('🚀 Initializing Fan Club gallery module...');

  // Check if we're on the Fan Club page
  if (document.getElementById('fanclub-gallery-grid')) {
    DurtNursUtils.debug('📍 Detected Fan Club gallery page');
    DurtNursUtils.debug('⭐ Rendering FULL gallery (no public flag filtering)');
    renderFullGallery();
  } else {
    DurtNursUtils.debug('ℹ️ No Fan Club gallery container found on this page');
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded before running code
DurtNursUtils.onDOMReady(init);

// Register with SPA navigation for page transitions
if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('fanclub-gallery', init, {
    pages: ['fanclub']
  });
}

// =============================================================================
// DEVELOPER CONSOLE MESSAGE
// =============================================================================

DurtNursUtils.debug('%c⭐ Fan Club Gallery Module Loaded', 'font-size: 14px; font-weight: bold; color: #A05A24;');
DurtNursUtils.debug('%cThis module displays ALL media items (no public flag filtering)', 'color: #8B7A43;');
DurtNursUtils.debug('%cUses shared lightbox.js with custom content renderer', 'color: #A8A29E;');
