/**
 * AUDIO PLAYER MODULE
 * Site-wide singleton audio player for music playback
 *
 * Features:
 * - Singleton pattern (only one track plays at a time)
 * - Persistent UI fixed to bottom of viewport
 * - Play/pause, seek, volume controls
 * - Keyboard accessible
 * - Volume preference saved to localStorage
 * - Playback persists across page navigation (auto-resumes)
 *
 * Usage:
 * DurtNursPlayer.play({ title, audioFile, duration, artwork, albumTitle, artist })
 * DurtNursPlayer.pause()
 * DurtNursPlayer.toggle()
 * DurtNursPlayer.stop()
 */

const DurtNursPlayer = {

  // ==========================================================================
  // STATE
  // ==========================================================================

  _audio: null,
  _container: null,
  _isInitialized: false,
  _currentTrack: null,

  // DOM element references (populated during init)
  _elements: {
    artwork: null,
    title: null,
    artist: null,
    playBtn: null,
    seek: null,
    time: null,
    volume: null,
    closeBtn: null
  },

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Play a track
   * @param {Object} trackData - Track information
   * @param {string} trackData.title - Track title
   * @param {string} trackData.audioFile - Path to audio file
   * @param {string} [trackData.duration] - Track duration (MM:SS)
   * @param {string} [trackData.artwork] - Path to artwork image
   * @param {string} [trackData.albumTitle] - Album name
   * @param {string} [trackData.artist] - Artist name
   */
  play(trackData) {
    if (!this._isInitialized) {
      console.warn('DurtNursPlayer: Not initialized');
      return;
    }

    if (!trackData || !trackData.audioFile) {
      console.error('DurtNursPlayer: Missing audioFile in trackData');
      return;
    }

    // If same track, just resume
    if (this._currentTrack && this._currentTrack.audioFile === trackData.audioFile) {
      this._audio.play();
      this._updatePlayButton(true);
      return;
    }

    // Load new track
    this._currentTrack = trackData;
    this._audio.src = trackData.audioFile;
    this._audio.load();

    // Update UI
    this._updateTrackInfo(trackData);
    this._showPlayer();

    // Play when ready
    this._audio.play().catch(err => {
      console.error('DurtNursPlayer: Playback failed', err);
      this._updatePlayButton(false);
    });
  },

  /**
   * Pause current track
   */
  pause() {
    if (this._audio && !this._audio.paused) {
      this._audio.pause();
    }
  },

  /**
   * Toggle play/pause
   */
  toggle() {
    if (!this._audio || !this._currentTrack) return;

    if (this._audio.paused) {
      this._audio.play().catch(err => {
        console.error('DurtNursPlayer: Playback failed', err);
      });
    } else {
      this._audio.pause();
    }
  },

  /**
   * Stop playback and hide player
   */
  stop() {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._audio.src = '';
    }
    this._currentTrack = null;
    this._clearPlaybackState();
    this._hidePlayer();
  },

  /**
   * Get current player state
   * @returns {Object} State object
   */
  getState() {
    return {
      isPlaying: this._audio ? !this._audio.paused : false,
      currentTrack: this._currentTrack,
      currentTime: this._audio ? this._audio.currentTime : 0,
      duration: this._audio ? this._audio.duration : 0
    };
  },

  /**
   * Initialize the player (call on DOM ready)
   */
  init() {
    if (this._isInitialized) return;

    this._createPlayerHTML();
    this._cacheElements();
    this._setupAudio();
    this._bindEvents();
    this._loadVolumePreference();
    this._setupPersistence();
    this._restorePlaybackState();

    this._isInitialized = true;
    console.log('DurtNursPlayer: Initialized');
  },

  // ==========================================================================
  // PRIVATE METHODS - INITIALIZATION
  // ==========================================================================

  /**
   * Create and inject player HTML into the DOM
   */
  _createPlayerHTML() {
    const playerHTML = `
      <div id="audio-player" class="audio-player audio-player--hidden" role="region" aria-label="Audio player">
        <div class="audio-player__track-info">
          <img class="audio-player__artwork" src="/assets/images/logo.png" alt="Album artwork">
          <div class="audio-player__text">
            <span class="audio-player__title">No track selected</span>
            <span class="audio-player__artist">tHE dURT nURS'</span>
          </div>
        </div>

        <div class="audio-player__controls">
          <button class="audio-player__play-btn" aria-label="Play" type="button">
            <span class="audio-player__play-icon" aria-hidden="true"></span>
          </button>

          <div class="audio-player__progress">
            <input type="range"
                   class="audio-player__seek"
                   min="0"
                   max="100"
                   value="0"
                   aria-label="Seek"
                   aria-valuemin="0"
                   aria-valuemax="100"
                   aria-valuenow="0">
            <span class="audio-player__time">0:00 / 0:00</span>
          </div>

          <div class="audio-player__volume-wrapper">
            <button class="audio-player__volume-btn" aria-label="Mute" type="button">
              <span class="audio-player__volume-icon" aria-hidden="true"></span>
            </button>
            <input type="range"
                   class="audio-player__volume"
                   min="0"
                   max="100"
                   value="80"
                   aria-label="Volume"
                   aria-valuemin="0"
                   aria-valuemax="100"
                   aria-valuenow="80">
          </div>
        </div>

        <button class="audio-player__close" aria-label="Close player" type="button">
          <span aria-hidden="true">&times;</span>
        </button>

        <audio id="audio-element" preload="metadata"></audio>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', playerHTML);
    this._container = document.getElementById('audio-player');
  },

  /**
   * Cache DOM element references for performance
   */
  _cacheElements() {
    this._elements = {
      artwork: this._container.querySelector('.audio-player__artwork'),
      title: this._container.querySelector('.audio-player__title'),
      artist: this._container.querySelector('.audio-player__artist'),
      playBtn: this._container.querySelector('.audio-player__play-btn'),
      seek: this._container.querySelector('.audio-player__seek'),
      time: this._container.querySelector('.audio-player__time'),
      volume: this._container.querySelector('.audio-player__volume'),
      volumeBtn: this._container.querySelector('.audio-player__volume-btn'),
      closeBtn: this._container.querySelector('.audio-player__close')
    };
  },

  /**
   * Set up the audio element
   */
  _setupAudio() {
    this._audio = document.getElementById('audio-element');
  },

  /**
   * Bind all event listeners
   */
  _bindEvents() {
    // Audio events
    this._audio.addEventListener('play', () => this._updatePlayButton(true));
    this._audio.addEventListener('pause', () => this._updatePlayButton(false));
    this._audio.addEventListener('ended', () => this._onTrackEnded());
    this._audio.addEventListener('timeupdate', () => this._onTimeUpdate());
    this._audio.addEventListener('loadedmetadata', () => this._onMetadataLoaded());
    this._audio.addEventListener('error', (e) => this._onAudioError(e));

    // Control events
    this._elements.playBtn.addEventListener('click', () => this.toggle());
    this._elements.seek.addEventListener('input', (e) => this._onSeekInput(e));
    this._elements.volume.addEventListener('input', (e) => this._onVolumeInput(e));
    this._elements.volumeBtn.addEventListener('click', () => this._toggleMute());
    this._elements.closeBtn.addEventListener('click', () => this.stop());

    // Keyboard shortcuts (when player is focused)
    this._container.addEventListener('keydown', (e) => this._onKeyDown(e));
  },

  // ==========================================================================
  // PRIVATE METHODS - EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle track ending
   */
  _onTrackEnded() {
    this._updatePlayButton(false);
    this._elements.seek.value = 0;
  },

  /**
   * Handle time updates during playback
   */
  _onTimeUpdate() {
    const { currentTime, duration } = this._audio;

    if (duration && isFinite(duration)) {
      // Update seek slider
      const percent = (currentTime / duration) * 100;
      this._elements.seek.value = percent;
      this._elements.seek.setAttribute('aria-valuenow', Math.round(percent));

      // Update time display
      this._elements.time.textContent = `${this._formatTime(currentTime)} / ${this._formatTime(duration)}`;
    }
  },

  /**
   * Handle metadata loaded
   */
  _onMetadataLoaded() {
    const { duration } = this._audio;

    if (duration && isFinite(duration)) {
      this._elements.time.textContent = `0:00 / ${this._formatTime(duration)}`;
    }
  },

  /**
   * Handle audio errors
   */
  _onAudioError(e) {
    console.error('DurtNursPlayer: Audio error', e);
    this._elements.title.textContent = 'Error loading track';
    this._updatePlayButton(false);
  },

  /**
   * Handle seek slider input
   */
  _onSeekInput(e) {
    const percent = e.target.value;
    const { duration } = this._audio;

    if (duration && isFinite(duration)) {
      this._audio.currentTime = (percent / 100) * duration;
    }
  },

  /**
   * Handle volume slider input
   */
  _onVolumeInput(e) {
    const volume = e.target.value / 100;
    this._audio.volume = volume;
    this._saveVolumePreference(e.target.value);
    this._updateVolumeIcon(volume);
  },

  /**
   * Toggle mute
   */
  _toggleMute() {
    this._audio.muted = !this._audio.muted;
    this._updateVolumeIcon(this._audio.muted ? 0 : this._audio.volume);
  },

  /**
   * Handle keyboard shortcuts
   */
  _onKeyDown(e) {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        this.toggle();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this._audio.currentTime = Math.max(0, this._audio.currentTime - 5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this._audio.currentTime = Math.min(this._audio.duration, this._audio.currentTime + 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._audio.volume = Math.min(1, this._audio.volume + 0.1);
        this._elements.volume.value = this._audio.volume * 100;
        this._updateVolumeIcon(this._audio.volume);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this._audio.volume = Math.max(0, this._audio.volume - 0.1);
        this._elements.volume.value = this._audio.volume * 100;
        this._updateVolumeIcon(this._audio.volume);
        break;
      case 'm':
        e.preventDefault();
        this._toggleMute();
        break;
      case 'Escape':
        e.preventDefault();
        this.stop();
        break;
    }
  },

  // ==========================================================================
  // PRIVATE METHODS - UI UPDATES
  // ==========================================================================

  /**
   * Update track info display
   */
  _updateTrackInfo(trackData) {
    this._elements.title.textContent = trackData.title || 'Unknown Track';
    this._elements.artist.textContent = trackData.artist || 'tHE dURT nURS\'';

    if (trackData.artwork) {
      this._elements.artwork.src = trackData.artwork;
      this._elements.artwork.alt = `${trackData.albumTitle || trackData.title} artwork`;
    } else {
      this._elements.artwork.src = '/assets/images/logo.png';
      this._elements.artwork.alt = 'tHE dURT nURS\' logo';
    }
  },

  /**
   * Update play/pause button state
   */
  _updatePlayButton(isPlaying) {
    this._elements.playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    this._container.classList.toggle('audio-player--playing', isPlaying);
  },

  /**
   * Update volume icon based on level
   */
  _updateVolumeIcon(volume) {
    const btn = this._elements.volumeBtn;

    if (this._audio.muted || volume === 0) {
      btn.setAttribute('aria-label', 'Unmute');
      this._container.classList.add('audio-player--muted');
    } else {
      btn.setAttribute('aria-label', 'Mute');
      this._container.classList.remove('audio-player--muted');
    }
  },

  /**
   * Show the player
   */
  _showPlayer() {
    this._container.classList.remove('audio-player--hidden');
    // Add padding to body to prevent content from being hidden behind player
    document.body.style.paddingBottom = '80px';
  },

  /**
   * Hide the player
   */
  _hidePlayer() {
    this._container.classList.add('audio-player--hidden');
    document.body.style.paddingBottom = '';
  },

  // ==========================================================================
  // PRIVATE METHODS - UTILITIES
  // ==========================================================================

  /**
   * Format seconds to MM:SS
   */
  _formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Load volume preference from localStorage
   */
  _loadVolumePreference() {
    const savedVolume = localStorage.getItem('durtNursPlayerVolume');

    if (savedVolume !== null) {
      const volume = parseInt(savedVolume, 10);
      this._audio.volume = volume / 100;
      this._elements.volume.value = volume;
      this._updateVolumeIcon(volume / 100);
    } else {
      this._audio.volume = 0.8;
    }
  },

  /**
   * Save volume preference to localStorage
   */
  _saveVolumePreference(volume) {
    localStorage.setItem('durtNursPlayerVolume', volume);
  },

  // ==========================================================================
  // PRIVATE METHODS - PLAYBACK PERSISTENCE
  // ==========================================================================

  /**
   * Storage key for playback state
   */
  _STORAGE_KEY: 'durtNursPlayerState',

  /**
   * Set up persistence - save state before page unload
   */
  _setupPersistence() {
    window.addEventListener('beforeunload', () => {
      this._savePlaybackState();
    });

    // Also save on visibility change (mobile browsers may not fire beforeunload)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this._savePlaybackState();
      }
    });
  },

  /**
   * Save current playback state to sessionStorage
   */
  _savePlaybackState() {
    // Only save if we have an active track
    if (!this._currentTrack || !this._audio) return;

    const state = {
      track: this._currentTrack,
      currentTime: this._audio.currentTime,
      isPlaying: !this._audio.paused,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(this._STORAGE_KEY, JSON.stringify(state));
      console.log('DurtNursPlayer: State saved', state.track.title, state.currentTime);
    } catch (e) {
      console.warn('DurtNursPlayer: Could not save state', e);
    }
  },

  /**
   * Restore playback state from sessionStorage
   */
  _restorePlaybackState() {
    try {
      const savedState = sessionStorage.getItem(this._STORAGE_KEY);
      if (!savedState) return;

      const state = JSON.parse(savedState);

      // Validate state has required data
      if (!state.track || !state.track.audioFile) {
        this._clearPlaybackState();
        return;
      }

      // Check if state is stale (more than 1 hour old)
      const ONE_HOUR = 60 * 60 * 1000;
      if (Date.now() - state.timestamp > ONE_HOUR) {
        console.log('DurtNursPlayer: Saved state expired, clearing');
        this._clearPlaybackState();
        return;
      }

      console.log('DurtNursPlayer: Restoring state', state.track.title, state.currentTime);

      // Load the track
      this._currentTrack = state.track;
      this._audio.src = state.track.audioFile;
      this._audio.load();

      // Update UI immediately
      this._updateTrackInfo(state.track);
      this._showPlayer();

      // Wait for audio to be ready, then seek and optionally play
      this._audio.addEventListener('loadedmetadata', () => {
        // Seek to saved position
        if (state.currentTime && state.currentTime > 0) {
          this._audio.currentTime = state.currentTime;
        }

        // Resume playing if it was playing before
        if (state.isPlaying) {
          this._audio.play().catch(err => {
            // Autoplay may be blocked - that's OK, user can click play
            console.log('DurtNursPlayer: Autoplay blocked, user interaction required');
            this._updatePlayButton(false);
          });
        }
      }, { once: true });

      // Handle load errors
      this._audio.addEventListener('error', () => {
        console.warn('DurtNursPlayer: Could not restore track, file may be unavailable');
        this._clearPlaybackState();
        this._hidePlayer();
      }, { once: true });

    } catch (e) {
      console.warn('DurtNursPlayer: Could not restore state', e);
      this._clearPlaybackState();
    }
  },

  /**
   * Clear saved playback state
   */
  _clearPlaybackState() {
    try {
      sessionStorage.removeItem(this._STORAGE_KEY);
    } catch (e) {
      // Ignore errors
    }
  }

};

// ==========================================================================
// AUTO-INITIALIZATION
// ==========================================================================

// Initialize when DOM is ready
DurtNursUtils.onDOMReady(() => {
  DurtNursPlayer.init();
});
