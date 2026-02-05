/**
 * SHARED UTILITIES MODULE
 * Common utility functions used across the dURT nURS website
 *
 * This module provides:
 * - Date formatting with Intl API
 * - JSON fetching with error handling
 * - Error display in containers
 * - DOM ready detection
 * - Debug logging (conditionally enabled)
 *
 * Usage: Include this script BEFORE other scripts that depend on it.
 * All functions are exposed via the global DurtNursUtils object.
 */

/**
 * Debug mode flag - automatically enabled on localhost for development
 * Set to true manually to enable debug logging in production
 */
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const DurtNursUtils = {

  /**
   * Debug logging - only outputs when DEBUG is true (localhost)
   * Use instead of console.log for development messages
   *
   * @param {...any} args - Arguments to pass to console.log
   */
  debug(...args) {
    if (DEBUG) {
      console.log(...args);
    }
  },

  /**
   * Debug warning - only outputs when DEBUG is true (localhost)
   * Use instead of console.warn for development warnings
   *
   * @param {...any} args - Arguments to pass to console.warn
   */
  debugWarn(...args) {
    if (DEBUG) {
      console.warn(...args);
    }
  },

  /**
   * Debug error - only outputs when DEBUG is true (localhost)
   * Use instead of console.error for development errors
   * Note: Critical errors that should always be logged should use console.error directly
   *
   * @param {...any} args - Arguments to pass to console.error
   */
  debugError(...args) {
    if (DEBUG) {
      console.error(...args);
    }
  },

  /**
   * Converts ISO date string (YYYY-MM-DD) to readable format (Month Day, Year)
   * Example: "2024-11-15" becomes "November 15, 2024"
   *
   * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
   * @returns {string} Formatted date string
   */
  formatDate(isoDate) {
    const date = new Date(isoDate);

    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return formatter.format(date);
  },

  /**
   * Fetches JSON data from a URL with error handling
   *
   * @param {string} url - URL to fetch JSON from
   * @returns {Promise<any>} Parsed JSON data
   * @throws {Error} If fetch fails or response is not OK
   */
  async fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Displays an error message in a specified container
   *
   * @param {string} containerId - ID of the container element
   * @param {string} message - Error message to display
   */
  displayError(containerId, message) {
    const container = document.getElementById(containerId);

    if (container) {
      container.innerHTML = `
        <div class="error-message" role="alert">
          <p><strong>Oops!</strong> ${message}</p>
        </div>
      `;
    }
  },

  /**
   * Executes a callback when the DOM is ready
   * Handles both cases: DOM still loading or already loaded
   *
   * @param {Function} callback - Function to execute when DOM is ready
   */
  onDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },

  /**
   * Generates HTML for a picture element with WebP source and fallback
   * Provides modern image format with graceful degradation
   *
   * @param {Object} options - Image options
   * @param {string} options.src - Original image path (PNG/JPG)
   * @param {string} options.alt - Alt text for accessibility
   * @param {string} [options.className] - CSS class for the img element
   * @param {string} [options.loading='lazy'] - Loading strategy ('lazy' or 'eager')
   * @param {string} [options.onerror] - Error handler for fallback
   * @returns {string} HTML string for picture element
   */
  pictureElement({ src, alt, className = '', loading = 'lazy', onerror = '' }) {
    // Generate WebP path by replacing extension
    const webpSrc = src.replace(/\.(png|jpe?g)$/i, '.webp');

    const classAttr = className ? ` class="${className}"` : '';
    const errorAttr = onerror ? ` onerror="${onerror}"` : '';

    return `<picture>
      <source srcset="${webpSrc}" type="image/webp">
      <img src="${src}" alt="${alt}"${classAttr} loading="${loading}"${errorAttr}>
    </picture>`;
  },

  /**
   * Generates HTML for a video element with WebM and MP4 sources
   * Used for animated album/track artwork that loops silently
   *
   * @param {Object} options - Video options
   * @param {string} options.src - Video path (MP4)
   * @param {string} [options.poster] - Poster image shown before video loads
   * @param {string} options.alt - Description for accessibility (aria-label)
   * @param {string} [options.className] - CSS class for the video element
   * @param {boolean} [options.loop=true] - Whether video should loop
   * @param {boolean} [options.muted=true] - Whether video should be muted
   * @param {boolean} [options.autoplay=true] - Whether video should autoplay
   * @param {boolean} [options.playsinline=true] - Prevents fullscreen on iOS
   * @returns {string} HTML string for video element
   */
  videoElement({ src, poster, alt, className = '', loop = true, muted = true, autoplay = true, playsinline = true }) {
    // Generate WebM path by replacing extension
    const webmSrc = src.replace(/\.mp4$/i, '.webm');

    const classAttr = className ? ` class="${className}"` : '';
    const posterAttr = poster ? ` poster="${poster}"` : '';

    // Build attribute string for boolean attributes
    const attrs = [
      loop ? 'loop' : '',
      muted ? 'muted' : '',
      autoplay ? 'autoplay' : '',
      playsinline ? 'playsinline' : ''
    ].filter(Boolean).join(' ');

    return `<video${classAttr}${posterAttr} ${attrs} aria-label="${alt}">
      <source src="${webmSrc}" type="video/webm">
      <source src="${src}" type="video/mp4">
    </video>`;
  },

  /**
   * Generates HTML for either a video or picture element based on content type
   * Use this when rendering media that could be either animated (video) or static (image)
   *
   * @param {Object} options - Media options
   * @param {string} options.src - Image path (PNG/JPG) - also used as default poster
   * @param {string} [options.video] - Video path (MP4) - if provided, renders video element
   * @param {string} [options.poster] - Custom poster image (defaults to src if not specified)
   * @param {string} options.alt - Alt text/aria-label for accessibility
   * @param {string} [options.className] - CSS class for the element
   * @param {string} [options.loading='lazy'] - Loading strategy for images
   * @param {string} [options.onerror] - Error handler for image fallback
   * @returns {string} HTML string for picture or video element
   */
  mediaElement({ src, video, poster, alt, className = '', loading = 'lazy', onerror = '' }) {
    if (video) {
      return this.videoElement({
        src: video,
        poster: poster || src,
        alt,
        className
      });
    }
    return this.pictureElement({ src, alt, className, loading, onerror });
  }

};

// Freeze the object to prevent accidental modifications
Object.freeze(DurtNursUtils);
