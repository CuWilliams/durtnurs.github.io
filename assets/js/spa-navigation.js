/**
 * SPA NAVIGATION MODULE
 * Enables seamless page navigation without full page reloads
 *
 * Purpose: Keep the audio player running during navigation by only
 * replacing the main content area instead of reloading the entire page.
 *
 * How it works:
 * 1. Intercepts clicks on internal links
 * 2. Fetches new page content via fetch()
 * 3. Replaces only the <main> element content
 * 4. Updates URL, title, and active nav state
 * 5. Reinitializes page-specific JavaScript
 *
 * Usage: Include after utils.js. Scripts register themselves via
 * DurtNursSPA.registerModule() for reinitialization after navigation.
 */

const DurtNursSPA = {

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  _config: {
    // Selector for the content container to replace
    contentSelector: 'main.page-layout',
    // Selector for navigation links that should update active state
    navLinkSelector: '.main-nav__link',
    // Class for active navigation link
    activeNavClass: 'main-nav__link--active',
    // Links to exclude from SPA navigation (external, downloads, etc.)
    excludePatterns: [
      /^https?:\/\/(?!.*durtnurs\.com)/i, // External links
      /\.(pdf|zip|mp3|wav|ogg)$/i,        // File downloads
      /^mailto:/i,                         // Email links
      /^tel:/i,                            // Phone links
      /#/                                  // Hash-only links (anchor jumps)
    ]
  },

  // Registry of page modules for reinitialization
  _modules: {},

  // Track loaded script URLs to avoid re-loading
  _loadedScripts: new Set(),

  // Flag to prevent duplicate initialization
  _initialized: false,

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Initialize SPA navigation
   * Call once on page load
   */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Mark currently loaded scripts
    document.querySelectorAll('script[src]').forEach(script => {
      this._loadedScripts.add(script.src);
    });

    // Set up link interception
    this._bindLinkClicks();

    // Set up browser history handling
    this._bindPopState();

    DurtNursUtils.debug('🚀 SPA navigation initialized');
  },

  /**
   * Register a module for reinitialization after navigation
   *
   * @param {string} name - Module name (should match script filename without .js)
   * @param {Function} initFn - Initialization function to call
   * @param {Object} [options] - Additional options
   * @param {Function} [options.cleanup] - Cleanup function before reinit
   * @param {string[]} [options.pages] - Specific pages where this module runs
   */
  registerModule(name, initFn, options = {}) {
    this._modules[name] = {
      init: initFn,
      cleanup: options.cleanup || null,
      pages: options.pages || null // null means runs on all pages
    };
    DurtNursUtils.debug(`📦 Registered SPA module: ${name}`);
  },

  /**
   * Navigate to a URL programmatically
   *
   * @param {string} url - URL to navigate to
   * @param {Object} [options] - Navigation options
   * @param {boolean} [options.replaceState] - Use replaceState instead of pushState
   * @returns {Promise<boolean>} Success status
   */
  async navigate(url, options = {}) {
    return this._performNavigation(url, options);
  },

  // ==========================================================================
  // LINK INTERCEPTION
  // ==========================================================================

  /**
   * Set up click handlers for internal links
   */
  _bindLinkClicks() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!this._shouldIntercept(href, link)) return;

      e.preventDefault();
      this._performNavigation(href);
    });
  },

  /**
   * Determine if a link should be intercepted for SPA navigation
   *
   * @param {string} href - Link href attribute
   * @param {HTMLAnchorElement} link - Link element
   * @returns {boolean} Whether to intercept
   */
  _shouldIntercept(href, link) {
    // Skip if modifier key is held (user wants new tab/window)
    if (link.target === '_blank') return false;

    // Skip if href is empty or javascript:
    if (!href || href.startsWith('javascript:')) return false;

    // Check against exclude patterns
    for (const pattern of this._config.excludePatterns) {
      if (pattern.test(href)) return false;
    }

    // Skip external links
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return false;
    } catch {
      return false;
    }

    return true;
  },

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  /**
   * Perform the actual navigation
   *
   * @param {string} url - URL to navigate to
   * @param {Object} [options] - Navigation options
   * @returns {Promise<boolean>} Success status
   */
  async _performNavigation(url, options = {}) {
    const fullUrl = new URL(url, window.location.origin).href;

    // Don't navigate to same URL
    if (fullUrl === window.location.href && !options.force) {
      return false;
    }

    try {
      // Show loading state
      this._setLoadingState(true);

      // Fetch new page
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Parse and extract content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract main content
      const newContent = doc.querySelector(this._config.contentSelector);
      if (!newContent) {
        throw new Error('Could not find main content in response');
      }

      // Run cleanup on current modules
      this._cleanupModules();

      // Replace content
      const currentContent = document.querySelector(this._config.contentSelector);
      currentContent.innerHTML = newContent.innerHTML;

      // Update page metadata
      this._updatePageMeta(doc);

      // Update navigation state
      this._updateNavigation(fullUrl);

      // Update browser history
      if (options.replaceState) {
        history.replaceState({ spa: true }, '', fullUrl);
      } else {
        history.pushState({ spa: true }, '', fullUrl);
      }

      // Close mobile nav if open
      this._closeMobileNav();

      // Scroll to top or to hash target
      this._handleScroll(url);

      // Load and initialize page scripts
      await this._initializePageScripts(doc);

      // Dispatch custom event for other scripts to hook into
      document.dispatchEvent(new CustomEvent('spa:navigation', {
        detail: { url: fullUrl }
      }));

      DurtNursUtils.debug(`✅ SPA navigated to: ${fullUrl}`);
      return true;

    } catch (error) {
      DurtNursUtils.debugError('❌ SPA navigation failed:', error);
      // Fall back to traditional navigation
      window.location.href = url;
      return false;

    } finally {
      this._setLoadingState(false);
    }
  },

  // ==========================================================================
  // CONTENT UPDATES
  // ==========================================================================

  /**
   * Update page title and meta tags
   *
   * @param {Document} doc - Parsed document
   */
  _updatePageMeta(doc) {
    // Update title
    const newTitle = doc.querySelector('title');
    if (newTitle) {
      document.title = newTitle.textContent;
    }

    // Update meta description
    const newDesc = doc.querySelector('meta[name="description"]');
    const currentDesc = document.querySelector('meta[name="description"]');
    if (newDesc && currentDesc) {
      currentDesc.setAttribute('content', newDesc.getAttribute('content'));
    }

    // Update Open Graph title and description
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    if (ogTitle) {
      const current = document.querySelector('meta[property="og:title"]');
      if (current) current.setAttribute('content', ogTitle.getAttribute('content'));
    }
    if (ogDesc) {
      const current = document.querySelector('meta[property="og:description"]');
      if (current) current.setAttribute('content', ogDesc.getAttribute('content'));
    }
  },

  /**
   * Update navigation active state
   *
   * @param {string} url - Current URL
   */
  _updateNavigation(url) {
    const pathname = new URL(url).pathname;
    const navLinks = document.querySelectorAll(this._config.navLinkSelector);

    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      const isActive = pathname === linkPath ||
        (linkPath !== '/' && pathname.startsWith(linkPath));

      link.classList.toggle(this._config.activeNavClass, isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  },

  /**
   * Close mobile navigation menu
   */
  _closeMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    if (toggle && toggle.checked) {
      toggle.checked = false;
    }
  },

  /**
   * Handle scroll position after navigation
   *
   * @param {string} url - Navigated URL
   */
  _handleScroll(url) {
    const hash = new URL(url, window.location.origin).hash;

    if (hash) {
      // Scroll to hash target
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // ==========================================================================
  // SCRIPT MANAGEMENT
  // ==========================================================================

  /**
   * Initialize scripts for the new page
   *
   * @param {Document} doc - Parsed document
   */
  async _initializePageScripts(doc) {
    // Find page-specific scripts in the new document
    const scripts = doc.querySelectorAll('script[src*="/assets/js/"]');
    const pageScripts = [];

    scripts.forEach(script => {
      const src = script.src;
      // Skip utils, audio-player, and spa-navigation (already loaded globally)
      if (src.includes('utils.js') ||
          src.includes('audio-player.js') ||
          src.includes('spa-navigation.js')) {
        return;
      }
      pageScripts.push(src);
    });

    // Load any new scripts
    for (const src of pageScripts) {
      if (!this._loadedScripts.has(src)) {
        await this._loadScript(src);
        this._loadedScripts.add(src);
      }
    }

    // Determine current page from URL
    const pageName = this._getPageName();

    // Run registered module initializers
    for (const [name, module] of Object.entries(this._modules)) {
      // Skip if module is page-specific and this isn't its page
      if (module.pages && !module.pages.includes(pageName)) {
        continue;
      }

      try {
        module.init();
        DurtNursUtils.debug(`🔄 Reinitialized module: ${name}`);
      } catch (error) {
        DurtNursUtils.debugError(`❌ Failed to reinitialize ${name}:`, error);
      }
    }
  },

  /**
   * Load a script dynamically
   *
   * @param {string} src - Script URL
   * @returns {Promise} Resolves when script loads
   */
  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  },

  /**
   * Run cleanup functions for registered modules
   */
  _cleanupModules() {
    for (const [name, module] of Object.entries(this._modules)) {
      if (module.cleanup) {
        try {
          module.cleanup();
        } catch (error) {
          DurtNursUtils.debugError(`❌ Cleanup failed for ${name}:`, error);
        }
      }
    }
  },

  /**
   * Get current page name from URL
   *
   * @returns {string} Page name (e.g., 'home', 'releases', 'about')
   */
  _getPageName() {
    const pathname = window.location.pathname;
    if (pathname === '/' || pathname === '/index.html') {
      return 'home';
    }
    // Extract page name from /page/ or /page/index.html
    const match = pathname.match(/\/([^/]+)\/?/);
    return match ? match[1] : 'home';
  },

  // ==========================================================================
  // BROWSER HISTORY
  // ==========================================================================

  /**
   * Handle browser back/forward buttons
   */
  _bindPopState() {
    window.addEventListener('popstate', (e) => {
      // Only handle our SPA states
      if (e.state?.spa) {
        this._performNavigation(window.location.href, {
          replaceState: true,
          force: true
        });
      } else {
        // For non-SPA history entries, do a full navigation
        // This handles the initial page load entry
        this._performNavigation(window.location.href, {
          replaceState: true,
          force: true
        });
      }
    });

    // Mark current state as SPA
    history.replaceState({ spa: true }, '', window.location.href);
  },

  // ==========================================================================
  // UI STATE
  // ==========================================================================

  /**
   * Set loading state on the page
   *
   * @param {boolean} isLoading - Whether page is loading
   */
  _setLoadingState(isLoading) {
    document.body.classList.toggle('spa-loading', isLoading);
  }

};

// Initialize on DOM ready
DurtNursUtils.onDOMReady(() => {
  DurtNursSPA.init();
});

// Freeze the public API
Object.freeze(DurtNursSPA);
