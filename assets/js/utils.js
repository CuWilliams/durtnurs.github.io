/**
 * SHARED UTILITIES MODULE
 * Common utility functions used across the dURT nURS website
 *
 * This module provides:
 * - Date formatting with Intl API
 * - JSON fetching with error handling
 * - Error display in containers
 * - DOM ready detection
 *
 * Usage: Include this script BEFORE other scripts that depend on it.
 * All functions are exposed via the global DurtNursUtils object.
 */

const DurtNursUtils = {

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
  }

};

// Freeze the object to prevent accidental modifications
Object.freeze(DurtNursUtils);
