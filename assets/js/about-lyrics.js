/**
 * ABOUT PAGE - LYRICS SHOWCASE MODULE
 * Handles lightbox + audio playback for handwritten lyrics thumbnails
 *
 * Features:
 * - Click thumbnail to open in lightbox at readable size
 * - Audio plays for the associated song
 * - Same song pages don't restart audio
 * - Different song click stops current, starts new
 * - Lightbox arrow navigation triggers correct audio
 */

(function() {
  'use strict';

  // All lyric pages in display order (built from DOM data attributes)
  var lyricsPages = [];

  // Lightbox state
  var state = {
    allMedia: [],
    currentIndex: 0,
    isLightboxOpen: false
  };

  var lightbox = null;

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    var container = document.getElementById('lyrics-showcase');
    if (!container) return;

    DurtNursUtils.debug('📝 Initializing lyrics showcase...');

    // Build pages array from DOM data attributes
    var groups = container.querySelectorAll('.lyrics-showcase__group');
    groups.forEach(function(group) {
      var songTitle = group.dataset.songTitle;
      var audioFile = group.dataset.audioFile;
      var albumTitle = group.dataset.albumTitle;
      var artist = group.dataset.artist;

      var pages = group.querySelectorAll('.lyrics-showcase__page');
      pages.forEach(function(page, pageIndex) {
        var img = page.querySelector('img');
        lyricsPages.push({
          title: songTitle + ' - Page ' + (pageIndex + 1),
          description: 'Handwritten lyrics for "' + songTitle + '"',
          imageSrc: img.src,
          imageAlt: img.alt,
          audioFile: audioFile,
          songTitle: songTitle,
          albumTitle: albumTitle,
          artist: artist
        });
      });
    });

    // Set up lightbox state
    state.allMedia = lyricsPages;

    // Create lightbox with custom renderer (do NOT call init — we handle clicks ourselves)
    lightbox = window.createLightbox({
      containerId: 'lyrics-showcase',
      getState: function() { return state; },
      setState: function(updates) { Object.assign(state, updates); },
      renderContent: renderLyricsContent
    });

    // Attach click handler via event delegation
    container.addEventListener('click', handlePageClick);

    DurtNursUtils.debug('📝 Lyrics showcase initialized with ' + lyricsPages.length + ' pages');
  }

  // =========================================================================
  // EVENT HANDLING
  // =========================================================================

  function handlePageClick(event) {
    var page = event.target.closest('.lyrics-showcase__page');
    if (!page) return;

    event.preventDefault();

    var index = parseInt(page.dataset.index, 10);
    if (isNaN(index) || index < 0 || index >= lyricsPages.length) return;

    // Open lightbox at this index
    lightbox.open(index);

    // Play associated audio
    playAudioForPage(lyricsPages[index]);
  }

  // =========================================================================
  // AUDIO LOGIC
  // =========================================================================

  /**
   * Play audio for the clicked lyrics page.
   * DurtNursPlayer.play() handles same-track resume automatically:
   * - Same audioFile → resumes without restart
   * - Different audioFile → stops old, loads and plays new
   */
  function playAudioForPage(pageData) {
    if (typeof DurtNursPlayer === 'undefined') {
      DurtNursUtils.debugWarn('📝 Audio player not available');
      return;
    }

    DurtNursPlayer.play({
      title: pageData.songTitle,
      audioFile: pageData.audioFile,
      albumTitle: pageData.albumTitle,
      artist: pageData.artist,
      artwork: pageData.imageSrc
    });
  }

  // =========================================================================
  // CUSTOM LIGHTBOX RENDERER
  // =========================================================================

  function renderLyricsContent(mediaItem, contentContainer, counterContainer, currentState) {
    contentContainer.innerHTML = '';

    // Full-size lyrics image
    var img = document.createElement('img');
    img.src = mediaItem.imageSrc;
    img.alt = mediaItem.imageAlt;
    img.className = 'lightbox__image';
    img.onerror = function() {
      this.src = '/assets/images/logo.png';
      this.alt = 'Image unavailable';
    };
    contentContainer.appendChild(img);

    // Info below image
    var infoDiv = document.createElement('div');
    infoDiv.className = 'lightbox__info';
    infoDiv.innerHTML =
      '<h3 class="lightbox__title">' + mediaItem.title + '</h3>' +
      '<p class="lightbox__description">' + mediaItem.description + '</p>';
    contentContainer.appendChild(infoDiv);

    // Counter
    var current = currentState.currentIndex + 1;
    var total = currentState.allMedia.length;
    counterContainer.textContent = current + ' / ' + total;

    // Trigger audio when navigating via lightbox arrows
    playAudioForPage(mediaItem);
  }

  // =========================================================================
  // AUTO-INITIALIZATION
  // =========================================================================

  DurtNursUtils.onDOMReady(init);

})();
