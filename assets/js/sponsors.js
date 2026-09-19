/**
 * SPONSORS MODULE
 * Handles dynamic loading and rendering of sponsor ad units from JSON
 *
 * Mirrors the merch.js pattern:
 * - Fetch API via DurtNursUtils.fetchJSON
 * - Template literals for HTML generation
 * - Progressive enhancement (static <noscript> fallback lives in sponsors.njk)
 * - BEM methodology for CSS classes
 *
 * Unlike merch cards, sponsor cards are not clickable as a whole. The card's
 * call to action is a real anchor when the sponsor has a real destination, and
 * a plain (non-focusable) span when the link is the "#" placeholder — nothing
 * to click means nothing to trap a keyboard user.
 */

// =============================================================================
// DATA FETCHING
// =============================================================================

/**
 * Fetches sponsor data from JSON file
 *
 * @returns {Promise<Object>} Sponsor data object with sponsors array
 */
async function fetchSponsorData() {
  try {
    DurtNursUtils.debug('📣 Fetching sponsors from JSON...');
    const data = await DurtNursUtils.fetchJSON('/assets/data/sponsors.json');

    DurtNursUtils.debug(`✅ Successfully loaded ${data.sponsors.length} sponsors`);
    return data;

  } catch (error) {
    DurtNursUtils.debugError('❌ Error fetching sponsors:', error);
    DurtNursUtils.displayError('sponsors-grid', 'Unable to load sponsors. Our advertisers have gone quiet.');
    return { sponsors: [] };
  }
}

// =============================================================================
// SORTING
// =============================================================================

/**
 * Sorts sponsors so featured ad units run first
 *
 * @param {Array} sponsors - Array of sponsor objects
 * @returns {Array} New sorted array (original unchanged)
 */
function sortSponsors(sponsors) {
  return [...sponsors].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Returns display text for badge type
 * Shares the merch badge vocabulary so the two stores read alike.
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
 * Generates HTML for a single sponsor ad card
 *
 * BEM Structure:
 * - Block: .sponsor-card
 * - Elements: .sponsor-card__poster, .sponsor-card__title, etc.
 * - Modifiers: .sponsor-card--featured, .sponsor-card__badge--new
 *
 * @param {Object} sponsor - Sponsor data object
 * @returns {string} HTML string for the card
 */
function renderSponsorCard(sponsor) {
  const {
    id,
    name,
    tagline,
    description,
    image,
    imageAlt,
    testimonial,
    testimonialAttribution,
    link,
    linkText,
    fineprint,
    badge,
    featured,
    parody
  } = sponsor;

  const featuredClass = featured ? ' sponsor-card--featured' : '';

  const badgeHTML = badge
    ? `<span class="sponsor-card__badge sponsor-card__badge--${badge}">${getBadgeText(badge)}</span>`
    : '';

  const posterHTML = DurtNursUtils.pictureElement({
    src: image,
    alt: imageAlt,
    className: 'sponsor-card__image',
    loading: 'lazy',
    onerror: "this.src='/assets/images/logo.png'; this.alt='Ad unavailable';"
  });

  const testimonialHTML = testimonial
    ? `<blockquote class="sponsor-card__testimonial">
         <p class="sponsor-card__testimonial-text">${testimonial}</p>
         ${testimonialAttribution ? `<footer class="sponsor-card__attribution">— ${testimonialAttribution}</footer>` : ''}
       </blockquote>`
    : '';

  // "#" is the site-wide placeholder for a destination that does not exist yet.
  const hasDestination = link && link !== '#';
  const ctaHTML = hasDestination
    ? `<a href="${link}" class="button button--secondary sponsor-card__cta">${linkText || 'Learn More'}</a>`
    : `<span class="sponsor-card__cta sponsor-card__cta--inert">${linkText || 'Available Nowhere'}</span>`;

  const fineprintHTML = fineprint
    ? `<p class="sponsor-card__fineprint">${fineprint}</p>`
    : '';

  return `
    <article class="sponsor-card${featuredClass}"
             id="${id}"
             data-parody="${parody === true}"
             aria-labelledby="${id}-title">

      <div class="sponsor-card__poster">
        ${posterHTML}
        ${badgeHTML}
      </div>

      <div class="sponsor-card__content">
        <p class="sponsor-card__eyebrow">A word from our sponsor</p>
        <h3 class="sponsor-card__title" id="${id}-title">${name}</h3>
        ${tagline ? `<p class="sponsor-card__tagline">${tagline}</p>` : ''}
        <p class="sponsor-card__description">${description}</p>
        ${testimonialHTML}
        <div class="sponsor-card__actions">${ctaHTML}</div>
        ${fineprintHTML}
      </div>

    </article>
  `;
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Renders all sponsors to the grid
 *
 * @param {Array} sponsors - Array of sponsor objects
 */
function renderSponsorsGrid(sponsors) {
  const container = document.getElementById('sponsors-grid');

  if (!container) {
    DurtNursUtils.debugWarn('⚠️ Sponsors grid container not found');
    return;
  }

  if (sponsors.length === 0) {
    container.innerHTML = `
      <div class="error-message" role="alert">
        <p>No sponsors at the moment. There were never any sponsors, but this feels worse somehow.</p>
      </div>
    `;
    return;
  }

  const sortedSponsors = sortSponsors(sponsors);
  container.innerHTML = sortedSponsors.map(renderSponsorCard).join('');

  DurtNursUtils.debug(`📣 Rendered ${sponsors.length} sponsors`);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the sponsors module
 */
async function init() {
  DurtNursUtils.debug('🚀 Initializing sponsors module...');

  if (!document.getElementById('sponsors-grid')) {
    DurtNursUtils.debug('ℹ️ No sponsors grid found on this page');
    return;
  }

  const data = await fetchSponsorData();
  renderSponsorsGrid(data.sponsors);

  DurtNursUtils.debug('✅ Sponsors module initialized');
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded
DurtNursUtils.onDOMReady(init);

// Register with SPA navigation for page transitions
if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('sponsors', init, {
    pages: ['sponsors']
  });
}
