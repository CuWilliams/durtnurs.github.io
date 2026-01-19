/**
 * SHARED LIGHTBOX MODULE
 * Reusable lightbox functionality for gallery pages
 *
 * This module provides a configurable lightbox that can be used by multiple galleries:
 * - Public gallery (gallery.html)
 * - Fan Club gallery (fanclub.html)
 *
 * Features:
 * - Photo and video support
 * - Keyboard navigation (ESC, Arrow keys)
 * - Click outside to close
 * - Accessible with ARIA attributes
 * - Counter display
 * - Custom content renderer support
 *
 * Usage:
 *   const lightbox = window.createLightbox({
 *     containerId: 'gallery-grid',
 *     getState: () => myState,
 *     setState: (updates) => Object.assign(myState, updates),
 *     renderContent: customRenderer  // optional
 *   });
 *   lightbox.init();
 */

// =============================================================================
// LIGHTBOX DOM CREATION
// =============================================================================

/**
 * Creates lightbox DOM structure with ARIA attributes
 *
 * @returns {HTMLElement} Lightbox element (appended to body)
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

  document.body.appendChild(lightbox);

  return lightbox;
}

// =============================================================================
// DEFAULT CONTENT RENDERER
// =============================================================================

/**
 * Default implementation for rendering lightbox content
 * Handles both photos and videos
 *
 * @param {Object} mediaItem - Media data object
 * @param {HTMLElement} contentContainer - Container for media content
 * @param {HTMLElement} counterContainer - Container for counter display
 * @param {Object} state - Current state { currentIndex, allMedia }
 */
function defaultRenderContent(mediaItem, contentContainer, counterContainer, state) {
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

  // Add title and description
  const infoDiv = document.createElement('div');
  infoDiv.className = 'lightbox__info';
  infoDiv.innerHTML = `
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
// NAVIGATION BUTTON VISIBILITY
// =============================================================================

/**
 * Updates visibility of prev/next buttons based on current position
 *
 * @param {HTMLElement} lightbox - Lightbox container element
 * @param {Object} state - Current state { currentIndex, allMedia }
 */
function updateNavigationButtons(lightbox, state) {
  const prevBtn = lightbox.querySelector('.lightbox__prev');
  const nextBtn = lightbox.querySelector('.lightbox__next');

  // Hide prev button on first item
  if (state.currentIndex === 0) {
    prevBtn.style.opacity = '0.3';
    prevBtn.style.pointerEvents = 'none';
  } else {
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
  }

  // Hide next button on last item
  if (state.currentIndex === state.allMedia.length - 1) {
    nextBtn.style.opacity = '0.3';
    nextBtn.style.pointerEvents = 'none';
  } else {
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a lightbox instance with given configuration
 *
 * @param {Object} config - Configuration object
 * @param {string} config.containerId - ID of gallery container element
 * @param {Function} config.getState - Function returning state { allMedia, currentIndex, isLightboxOpen }
 * @param {Function} config.setState - Function to update state (receives partial state object)
 * @param {Function} [config.renderContent] - Optional custom content renderer
 * @returns {Object} Lightbox controller with init(), open(), close(), showPrevious(), showNext()
 */
window.createLightbox = function(config) {
  const { containerId, getState, setState, renderContent } = config;

  // Use custom renderer or default
  const contentRenderer = renderContent || defaultRenderContent;

  // Track lightbox element and keyboard handler
  let lightboxElement = null;
  let keyboardHandler = null;

  // ==========================================================================
  // INTERNAL FUNCTIONS
  // ==========================================================================

  /**
   * Opens lightbox at specified index
   * @param {number} index - Index in media array
   */
  function open(index) {
    const state = getState();

    // Update state
    setState({
      currentIndex: index,
      isLightboxOpen: true
    });

    // Get media item
    const mediaItem = state.allMedia[index];

    if (!mediaItem) {
      console.warn(`⚠️ No media item at index ${index}`);
      return;
    }

    console.log(`🔍 Opening lightbox for: ${mediaItem.title}`);

    // Get or create lightbox
    if (!lightboxElement) {
      lightboxElement = createLightboxStructure();
      attachLightboxListeners();
    }

    // Get updated state after setState
    const updatedState = getState();

    // Render content
    const contentContainer = lightboxElement.querySelector('.lightbox__content');
    const counterContainer = lightboxElement.querySelector('.lightbox__counter');
    contentRenderer(mediaItem, contentContainer, counterContainer, updatedState);

    // Update navigation buttons
    updateNavigationButtons(lightboxElement, updatedState);

    // Show lightbox
    lightboxElement.classList.add('lightbox--active');

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';

    // Set focus to close button for keyboard accessibility
    const closeBtn = lightboxElement.querySelector('.lightbox__close');
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 100);
    }

    // Initialize keyboard navigation
    initKeyboardNav();
  }

  /**
   * Closes lightbox
   */
  function close() {
    console.log('❌ Closing lightbox');

    if (lightboxElement) {
      lightboxElement.classList.remove('lightbox--active');
      document.body.style.overflow = '';
    }

    setState({ isLightboxOpen: false });

    // Remove keyboard listener
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
  }

  /**
   * Shows previous item
   */
  function showPrevious() {
    const state = getState();
    if (state.currentIndex > 0) {
      open(state.currentIndex - 1);
    }
  }

  /**
   * Shows next item
   */
  function showNext() {
    const state = getState();
    if (state.currentIndex < state.allMedia.length - 1) {
      open(state.currentIndex + 1);
    }
  }

  /**
   * Attaches event listeners to lightbox buttons
   */
  function attachLightboxListeners() {
    // Close button
    const closeBtn = lightboxElement.querySelector('.lightbox__close');
    closeBtn.addEventListener('click', close);

    // Previous button
    const prevBtn = lightboxElement.querySelector('.lightbox__prev');
    prevBtn.addEventListener('click', showPrevious);

    // Next button
    const nextBtn = lightboxElement.querySelector('.lightbox__next');
    nextBtn.addEventListener('click', showNext);

    // Click outside content to close
    lightboxElement.addEventListener('click', (e) => {
      if (e.target === lightboxElement) {
        close();
      }
    });
  }

  /**
   * Initializes keyboard navigation
   */
  function initKeyboardNav() {
    // Create handler if not exists
    if (!keyboardHandler) {
      keyboardHandler = function(event) {
        const state = getState();
        if (!state.isLightboxOpen) return;

        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            close();
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
      };
    }

    // Add listener
    document.addEventListener('keydown', keyboardHandler);
  }

  /**
   * Handles click on gallery card
   * @param {Event} event - Click event
   */
  function handleCardClick(event) {
    const card = event.target.closest('.gallery-card');
    if (!card) return;

    const index = parseInt(card.dataset.index, 10);

    if (isNaN(index)) {
      console.warn('⚠️ Card missing data-index attribute');
      return;
    }

    open(index);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  return {
    /**
     * Initializes lightbox click handlers on gallery container
     */
    init: function() {
      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(`⚠️ Lightbox container #${containerId} not found`);
        return;
      }

      // Add click listener to container (event delegation)
      container.addEventListener('click', handleCardClick);

      // Add keyboard listener for accessibility (Enter/Space on focused cards)
      container.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      });

      console.log(`🔍 Lightbox initialized for #${containerId}`);
    },

    /**
     * Opens lightbox at specified index
     * @param {number} index - Index in media array
     */
    open: open,

    /**
     * Closes lightbox
     */
    close: close,

    /**
     * Shows previous item
     */
    showPrevious: showPrevious,

    /**
     * Shows next item
     */
    showNext: showNext,

    /**
     * Cleans up event listeners (optional)
     */
    destroy: function() {
      const container = document.getElementById(containerId);
      if (container) {
        container.removeEventListener('click', handleCardClick);
      }
      if (keyboardHandler) {
        document.removeEventListener('keydown', keyboardHandler);
      }
      if (lightboxElement) {
        lightboxElement.remove();
        lightboxElement = null;
      }
    }
  };
};

// =============================================================================
// MODULE LOADED MESSAGE
// =============================================================================

console.log('%c🔲 Lightbox Module Loaded', 'font-size: 12px; font-weight: bold; color: #8B7A43;');
