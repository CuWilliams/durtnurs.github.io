/**
 * FEATURED SONGS MODULE
 * Dynamically loads and displays featured songs on the homepage
 *
 * PURPOSE:
 * This module collects tracks marked as "featured" from releases.json
 * and displays them in a card grid on the homepage. Songs can come from
 * any album - they are independent of the featured release.
 *
 * BENEFITS:
 * - Single source of truth: Track data comes from releases.json
 * - Easy to feature songs: Just add "featured": true to any track with audio
 * - Independent from featured album: Mix and match songs from any release
 * - Section collapses gracefully when no songs are featured
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const SONGS_CONFIG = {
  dataUrl: '/assets/data/releases.json',
  sectionId: 'featured-songs-section',
  containerId: 'featured-songs-container',
  loadingId: 'featured-songs-loading',
  errorId: 'featured-songs-error'
};

// =============================================================================
// DATA COLLECTION
// =============================================================================

/**
 * Collects all featured tracks from all releases
 * Attaches album context (title, artwork, id) to each track
 * Uses track-specific artwork if available, falls back to album cover
 *
 * @param {Array} releases - Array of release objects
 * @returns {Array} Array of track objects with album context
 */
function collectFeaturedSongs(releases) {
  const featuredSongs = [];

  releases.forEach(release => {
    if (!release.tracklist) return;

    release.tracklist.forEach(track => {
      // Only include tracks that are featured, have audio, and have an audio file
      if (track.featured && track.hasAudio && track.audioFile) {
        // Use track artwork if available, otherwise fall back to album cover
        const artwork = track.artwork || release.coverArt;
        const artworkAlt = track.artworkAlt || track.artwork
          ? `${track.title} song artwork`
          : release.coverArtAlt;

        featuredSongs.push({
          // Track data
          title: track.title,
          audioFile: track.audioFile,
          duration: track.duration || '',
          // Artwork (track-specific or album fallback)
          artwork: artwork,
          artworkAlt: artworkAlt,
          // Album context for display and audio player
          albumTitle: release.title,
          albumId: release.id,
          artist: release.artist || "tHE dURT nURS'"
        });
      }
    });
  });

  console.log(`🎵 Found ${featuredSongs.length} featured song(s)`);
  return featuredSongs;
}

// =============================================================================
// HTML GENERATION
// =============================================================================

/**
 * Renders a single song card
 * Follows BEM naming convention matching other card components
 *
 * @param {Object} song - Song object with track and album data
 * @returns {string} HTML string for the song card
 */
function renderSongCard(song) {
  // Build data attribute for audio player integration
  const trackData = {
    title: song.title,
    audioFile: song.audioFile,
    duration: song.duration,
    artwork: song.artwork,
    albumTitle: song.albumTitle,
    artist: song.artist
  };
  const dataAttr = encodeURIComponent(JSON.stringify(trackData));

  // Generate artwork with WebP support
  const artworkHTML = DurtNursUtils.pictureElement({
    src: song.artwork,
    alt: song.artworkAlt || song.albumTitle + ' album artwork',
    className: 'song-card__artwork',
    loading: 'lazy'
  });

  return `
    <article class="song-card">
      <div class="song-card__artwork-wrapper">
        ${artworkHTML}
        <button class="song-card__play-btn"
                type="button"
                aria-label="Play ${song.title}"
                data-track="${dataAttr}">
          <span class="song-card__play-icon" aria-hidden="true"></span>
        </button>
      </div>
      <div class="song-card__info">
        <h3 class="song-card__title">${song.title}</h3>
        <p class="song-card__album">
          From: <a href="/releases/#${song.albumId}">${song.albumTitle}</a>
        </p>
        ${song.duration ? `<span class="song-card__duration">${song.duration}</span>` : ''}
      </div>
    </article>
  `;
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Shows/hides the entire section based on content availability
 * Implements the collapse behavior requirement
 *
 * @param {boolean} hasContent - Whether to show the section
 */
function toggleSongsSectionVisibility(hasContent) {
  const section = document.getElementById(SONGS_CONFIG.sectionId);
  if (section) {
    section.style.display = hasContent ? '' : 'none';
  }
}

/**
 * Shows the loading state
 */
function showSongsLoading() {
  const loadingEl = document.getElementById(SONGS_CONFIG.loadingId);
  const errorEl = document.getElementById(SONGS_CONFIG.errorId);
  const container = document.getElementById(SONGS_CONFIG.containerId);

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';
  if (container) container.innerHTML = '';
}

/**
 * Hides loading and error states
 */
function hideSongsStates() {
  const loadingEl = document.getElementById(SONGS_CONFIG.loadingId);
  const errorEl = document.getElementById(SONGS_CONFIG.errorId);

  if (loadingEl) loadingEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
}

// =============================================================================
// EVENT HANDLING
// =============================================================================

/**
 * Binds click handlers for play buttons
 * Integrates with existing DurtNursPlayer
 */
function bindSongPlayButtons() {
  const container = document.getElementById(SONGS_CONFIG.containerId);
  if (!container) return;

  container.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.song-card__play-btn');
    if (!playBtn) return;

    e.preventDefault();

    const trackDataStr = playBtn.getAttribute('data-track');
    if (!trackDataStr) return;

    try {
      const trackData = JSON.parse(decodeURIComponent(trackDataStr));
      if (typeof DurtNursPlayer !== 'undefined') {
        DurtNursPlayer.play(trackData);
      } else {
        console.warn('⚠️ DurtNursPlayer not available');
      }
    } catch (err) {
      console.error('Error parsing track data:', err);
    }
  });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Main initialization function
 * Loads featured songs and renders them, or hides section if none found
 */
async function initFeaturedSongs() {
  console.log('🎵 Initializing featured songs module...');

  const container = document.getElementById(SONGS_CONFIG.containerId);
  if (!container) {
    console.log('ℹ️ Featured songs container not found, skipping');
    return;
  }

  try {
    showSongsLoading();

    // Fetch releases data
    const data = await DurtNursUtils.fetchJSON(SONGS_CONFIG.dataUrl);
    const featuredSongs = collectFeaturedSongs(data.releases);

    // If no featured songs, hide the entire section
    if (featuredSongs.length === 0) {
      console.log('ℹ️ No featured songs found, hiding section');
      toggleSongsSectionVisibility(false);
      return;
    }

    // Render the song cards
    const cardsHTML = featuredSongs
      .map(song => renderSongCard(song))
      .join('');

    container.innerHTML = `
      <div class="song-grid">
        ${cardsHTML}
      </div>
    `;

    hideSongsStates();
    toggleSongsSectionVisibility(true);
    bindSongPlayButtons();

    console.log('✅ Featured songs module initialized successfully');

  } catch (error) {
    console.error('❌ Failed to load featured songs:', error);
    // On error, hide the section rather than showing an error message
    toggleSongsSectionVisibility(false);
  }
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

DurtNursUtils.onDOMReady(initFeaturedSongs);

// Register with SPA navigation for page transitions
if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('featured-songs', initFeaturedSongs, {
    pages: ['home']
  });
}
