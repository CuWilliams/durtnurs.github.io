/**
 * MERCH MODULE
 * Handles dynamic loading and rendering of merchandise from JSON
 *
 * This module demonstrates:
 * - Fetch API for loading external JSON data
 * - Template literals for HTML generation
 * - DOM manipulation for dynamic content
 * - Progressive enhancement (works alongside static HTML fallback)
 * - Click handling for product navigation
 * - BEM methodology for CSS classes
 * - Sales banner configuration
 */

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches merchandise data from JSON file
 * Uses shared DurtNursUtils.fetchJSON for HTTP requests.
 *
 * @returns {Promise<Object>} Merchandise data object with merchandise array and salesBanner config
 */
async function fetchMerchData() {
  try {
    DurtNursUtils.debug('📦 Fetching merchandise from JSON...');
    const data = await DurtNursUtils.fetchJSON('/assets/data/merch.json');

    DurtNursUtils.debug(`✅ Successfully loaded ${data.merchandise.length} products`);
    return data;

  } catch (error) {
    DurtNursUtils.debugError('❌ Error fetching merchandise:', error);
    DurtNursUtils.displayError('merch-grid', 'Unable to load merchandise. Even our store is broken.');
    return { merchandise: [], salesBanner: { active: false } };
  }
}

// =============================================================================
// SALES BANNER
// =============================================================================

/**
 * Renders the sales banner if active in JSON config
 *
 * @param {Object} bannerData - Sales banner configuration from merch.json
 */
function renderSalesBanner(bannerData) {
  const bannerElement = document.getElementById('sales-banner');

  if (!bannerElement) {
    DurtNursUtils.debugWarn('⚠️ Sales banner container not found');
    return;
  }

  if (!bannerData || !bannerData.active) {
    bannerElement.classList.add('sales-banner--hidden');
    DurtNursUtils.debug('🏷️ Sales banner inactive, hiding');
    return;
  }

  // Remove hidden class and populate content
  bannerElement.classList.remove('sales-banner--hidden');
  bannerElement.innerHTML = `
    <p class="sales-banner__text">${bannerData.message}</p>
    ${bannerData.subtext ? `<p class="sales-banner__subtext">${bannerData.subtext}</p>` : ''}
  `;

  DurtNursUtils.debug('🏷️ Sales banner rendered');
}

// =============================================================================
// SORTING
// =============================================================================

/**
 * Sorts merchandise array by featured status, then availability
 *
 * Sorting strategy:
 * 1. Featured items appear first
 * 2. Available items before sold out
 *
 * @param {Array} products - Array of product objects
 * @returns {Array} New sorted array (original unchanged)
 */
function sortMerch(products) {
  return [...products].sort((a, b) => {
    // Featured items first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    // Available items before sold out
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;

    return 0;
  });
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Returns display text for badge type
 *
 * @param {string} badgeType - Badge type identifier (new, sold, wow, hot)
 * @returns {string} Display text with punctuation
 */
function getBadgeText(badgeType) {
  const badges = {
    'new': 'New!',
    'sold': 'Sold!',
    'wow': 'Wow!',
    'hot': 'Hot!'
  };
  return badges[badgeType] || badgeType;
}

/**
 * Generates HTML for a single product card
 * Uses BEM naming convention for CSS classes
 *
 * BEM Structure:
 * - Block: .merch-card
 * - Elements: .merch-card__image, .merch-card__title, etc.
 * - Modifiers: .merch-card--featured, .merch-card__badge--new, etc.
 *
 * @param {Object} product - Product data object
 * @returns {string} HTML string for the card
 */
function renderMerchCard(product) {
  const {
    id,
    title,
    price,
    image,
    imageAlt,
    description,
    badge,
    available,
    featured
  } = product;

  // Build modifier classes
  const featuredClass = featured ? ' merch-card--featured' : '';

  // Generate badge HTML if present
  const badgeHTML = badge
    ? `<span class="merch-card__badge merch-card__badge--${badge}">${getBadgeText(badge)}</span>`
    : '';

  // Generate image with WebP support using shared utility
  const imageHTML = DurtNursUtils.pictureElement({
    src: image,
    alt: imageAlt,
    className: 'merch-card__image',
    loading: 'lazy',
    onerror: "this.src='/assets/images/logo.png'; this.alt='Image unavailable';"
  });

  // CTA text based on availability
  const ctaText = available ? 'Add to Regrets →' : 'Sold Out (Somehow)';

  return `
    <article class="merch-card${featuredClass}"
             id="${id}"
             data-available="${available}"
             role="button"
             tabindex="0"
             aria-label="${available ? `Purchase ${title}` : `${title} - Sold out`}">

      <div class="merch-card__image-wrapper">
        ${imageHTML}
        ${badgeHTML}
        <div class="merch-card__price-tag">$${price}</div>
      </div>

      <div class="merch-card__content">
        <h3 class="merch-card__title">${title}</h3>
        <p class="merch-card__description">${description}</p>
        <span class="merch-card__cta">${ctaText}</span>
      </div>

    </article>
  `;
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Renders all merchandise to the grid
 *
 * @param {Array} products - Array of product objects
 */
function renderMerchGrid(products) {
  const container = document.getElementById('merch-grid');

  if (!container) {
    DurtNursUtils.debugWarn('⚠️ Merch grid container not found');
    return;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="error-message" role="alert">
        <p>No merchandise available. We sold out. (Just kidding, we never had anything.)</p>
      </div>
    `;
    return;
  }

  // Sort products and generate HTML
  const sortedProducts = sortMerch(products);
  const cardsHTML = sortedProducts.map(renderMerchCard).join('');
  container.innerHTML = cardsHTML;

  // Add click and keyboard handlers
  setupClickHandlers(container);

  DurtNursUtils.debug(`🛒 Rendered ${products.length} products`);
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Sets up click handlers for product cards
 * Uses event delegation for performance
 *
 * @param {HTMLElement} container - Grid container element
 */
function setupClickHandlers(container) {
  container.addEventListener('click', handleCardClick);
  container.addEventListener('keydown', handleCardKeydown);
}

/**
 * Handles click on product card
 * Navigates to checkout for available items
 *
 * @param {Event} event - Click event
 */
function handleCardClick(event) {
  const card = event.target.closest('.merch-card');
  if (!card) return;

  const isAvailable = card.dataset.available === 'true';

  if (isAvailable) {
    DurtNursUtils.debug('🛒 Navigating to checkout...');
    window.location.href = '/checkout/';
  } else {
    DurtNursUtils.debug('❌ Item is sold out');
    // Visual feedback for sold out items could be added here
  }
}

/**
 * Handles keyboard navigation on product cards
 * Enter and Space trigger same action as click
 *
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleCardKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleCardClick(event);
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the merch module
 * Fetches data, renders banner and grid
 */
async function init() {
  DurtNursUtils.debug('🚀 Initializing merch module...');

  // Check if we're on the merch page
  if (!document.getElementById('merch-grid')) {
    DurtNursUtils.debug('ℹ️ No merch grid found on this page');
    return;
  }

  // Fetch merchandise data
  const data = await fetchMerchData();

  // Render sales banner
  renderSalesBanner(data.salesBanner);

  // Render merchandise grid
  renderMerchGrid(data.merchandise);

  DurtNursUtils.debug('✅ Merch module initialized');
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded
DurtNursUtils.onDOMReady(init);

// Register with SPA navigation for page transitions
if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('merch', init, {
    pages: ['merch']
  });
}
