/**
 * HERO KALEIDOSCOPE MODULE
 *
 * Animated orbiting objects behind the hero logo.
 * Objects emerge from behind the logo, arc outward in a semicircle
 * (3 o'clock through 12 o'clock to 9 o'clock), then recede back.
 *
 * Tablet/Desktop: Full orbit animation with glow effects
 * Mobile: Subtle device-tilt parallax on the logo
 *
 * Features:
 *  - Randomized arc paths, durations, and spawn intervals
 *  - Dynamic image manifest (fetched from hero-objects.json)
 *  - Preloads all images before starting
 *  - Pauses when tab not visible (Page Visibility API)
 *  - Respects prefers-reduced-motion
 *  - offset-path fallback for unsupported browsers
 *  - SPA navigation cleanup/reinit
 */

/* ============================================
   CONFIGURATION
   ============================================ */

const HERO_CONFIG = {
  manifestUrl: '/assets/data/hero-objects.json',
  containerId: 'hero-kaleidoscope',
  logoId: 'hero-logo',

  // Spawn timing
  maxSimultaneous: 20,       // Max objects animating at once
  spawnIntervalMin: 600,     // ms between spawns (min)
  spawnIntervalMax: 1800,    // ms between spawns (max)

  // Orbit parameters
  durationMin: 6000,         // ms for fastest orbit
  durationMax: 12000,        // ms for slowest orbit
  radiusBase: 28,            // vmin units - base orbit radius
  radiusVariance: 0.2,       // +/- 20% randomness on radius
  angleVariance: 15,         // degrees of randomness on start/end angles

  // Responsive
  mobileBreakpoint: 768,     // px - no orbit below this

  // Mobile tilt parallax
  tiltMaxDeg: 5,             // max tilt rotation in degrees
  tiltSensorRange: 15        // device orientation degrees to map to max tilt
};


/* ============================================
   MODULE STATE
   ============================================ */

let spawnTimer = null;
let activeCount = 0;
let manifest = null;
let preloadedImages = [];
let recentlyUsed = [];
let isRunning = false;
let supportsOffsetPath = false;
let tiltHandler = null;


/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Random integer between min and max (inclusive)
 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random float between min and max
 */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Check if offset-path is supported
 */
function checkOffsetPathSupport() {
  return CSS.supports && CSS.supports('offset-path', "path('M 0 0 L 10 0')");
}

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Convert vmin value to pixels based on current viewport
 */
function vminToPx(vmin) {
  return vmin * Math.min(window.innerWidth, window.innerHeight) / 100;
}


/* ============================================
   ARC PATH GENERATION
   ============================================ */

/**
 * Generate a randomized SVG path for a full 360° orbit.
 *
 * The path goes: center → outward to start point → full circle → back to center
 * Each call produces a slightly different path via radius and start angle variance.
 * SVG can't express a full circle with one arc, so we use two semicircular arcs.
 *
 * Returns a CSS offset-path value string: path('M ... A ... A ... L ...')
 */
function generateArcPath() {
  var baseRadius = HERO_CONFIG.radiusBase;
  var variance = HERO_CONFIG.radiusVariance;
  var radius = baseRadius * (1 + (Math.random() * 2 - 1) * variance);

  // Convert vmin to px
  var R = vminToPx(radius);

  // Randomize start angle so objects don't all emerge in the same direction
  var startDeg = Math.random() * 360;
  var startRad = startDeg * Math.PI / 180;

  // Start point on the circle
  var startX = R * Math.cos(startRad);
  var startY = R * Math.sin(startRad);

  // Opposite point (180° away) for splitting into two semicircular arcs
  var midX = -startX;
  var midY = -startY;

  // Full 360° orbit: center → start → arc half circle → arc second half → back to center
  // Two arcs with sweep-flag=1 (clockwise) create a full circle
  var path = 'M 0,0'
    + ' L ' + startX.toFixed(1) + ',' + startY.toFixed(1)
    + ' A ' + R.toFixed(1) + ',' + R.toFixed(1) + ' 0 0,1 '
    + midX.toFixed(1) + ',' + midY.toFixed(1)
    + ' A ' + R.toFixed(1) + ',' + R.toFixed(1) + ' 0 0,1 '
    + startX.toFixed(1) + ',' + startY.toFixed(1)
    + ' L 0,0';

  return "path('" + path + "')";
}

/**
 * Fallback for browsers without offset-path support.
 * Returns a random position (angle + radius) for a simple fade-in/fade-out effect.
 */
function generateFallbackPosition() {
  var angle = randomFloat(0, 360);
  var R = vminToPx(HERO_CONFIG.radiusBase * randomFloat(0.6, 1.2));
  var rad = angle * Math.PI / 180;
  return {
    x: R * Math.cos(rad),
    y: R * Math.sin(rad)
  };
}


/* ============================================
   IMAGE SELECTION
   ============================================ */

/**
 * Pick a random image from the manifest, avoiding recent repeats.
 * Returns an object from manifest.objects.
 */
function pickRandomImage() {
  if (!manifest || manifest.objects.length === 0) return null;

  var available = manifest.objects.filter(function(obj) {
    return recentlyUsed.indexOf(obj.id) === -1;
  });

  // If all images have been used recently, reset the recency list
  if (available.length === 0) {
    recentlyUsed = [];
    available = manifest.objects;
  }

  var chosen = available[Math.floor(Math.random() * available.length)];

  // Track recently used (keep last 3)
  recentlyUsed.push(chosen.id);
  if (recentlyUsed.length > 3) {
    recentlyUsed.shift();
  }

  return chosen;
}


/* ============================================
   OBJECT SPAWNING
   ============================================ */

/**
 * Spawn a single orbiting object into the kaleidoscope container.
 */
function spawnObject() {
  var container = document.getElementById(HERO_CONFIG.containerId);
  if (!container) return;

  // Don't exceed max simultaneous objects
  if (activeCount >= HERO_CONFIG.maxSimultaneous) return;

  var imageData = pickRandomImage();
  if (!imageData) return;

  // Create img element
  var img = document.createElement('img');
  img.src = imageData.src;
  img.alt = '';  // Decorative, aria-hidden on container
  img.className = 'hero-kaleidoscope__object';
  img.draggable = false;

  // Random orbit duration
  var duration = randomBetween(HERO_CONFIG.durationMin, HERO_CONFIG.durationMax);
  img.style.setProperty('--orbit-duration', duration + 'ms');

  if (supportsOffsetPath) {
    // Set randomized arc path
    img.style.offsetPath = generateArcPath();
    img.style.offsetRotate = '0deg';
    img.style.offsetDistance = '0%';
  } else {
    // Fallback: position randomly around center, use simple fade animation
    var pos = generateFallbackPosition();
    img.style.left = 'calc(50% + ' + pos.x.toFixed(1) + 'px)';
    img.style.top = 'calc(50% + ' + pos.y.toFixed(1) + 'px)';
    img.style.transform = 'translate(-50%, -50%) scale(0.2)';
    img.style.animation = 'hero-orbit-fallback ' + duration + 'ms var(--ease-in-out) forwards';
  }

  // Add to DOM
  container.appendChild(img);
  activeCount++;

  // Trigger animation on next frame (allows browser to register the element)
  requestAnimationFrame(function() {
    img.classList.add('hero-kaleidoscope__object--active');
  });

  // Remove on animation end
  img.addEventListener('animationend', function() {
    if (img.parentNode) {
      img.parentNode.removeChild(img);
    }
    activeCount--;
  });
}


/* ============================================
   SPAWN LOOP
   ============================================ */

/**
 * Schedule the next object spawn at a random interval.
 */
function scheduleNextSpawn() {
  if (!isRunning) return;

  var delay = randomBetween(HERO_CONFIG.spawnIntervalMin, HERO_CONFIG.spawnIntervalMax);
  spawnTimer = setTimeout(function() {
    spawnObject();
    scheduleNextSpawn();
  }, delay);
}

/**
 * Start the spawn loop.
 */
function startSpawning() {
  isRunning = true;
  // Spawn a few immediately for instant visual feedback
  for (var i = 0; i < 3; i++) {
    setTimeout(spawnObject, i * 400);
  }
  scheduleNextSpawn();
}

/**
 * Stop the spawn loop.
 */
function stopSpawning() {
  isRunning = false;
  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }
}


/* ============================================
   IMAGE PRELOADING
   ============================================ */

/**
 * Preload all images from the manifest.
 * Returns a Promise that resolves when all images are loaded.
 */
function preloadImages(objects) {
  var promises = objects.map(function(obj) {
    return new Promise(function(resolve) {
      var img = new Image();
      img.onload = resolve;
      img.onerror = resolve;  // Don't block on failed loads
      img.src = obj.src;
      preloadedImages.push(img);
    });
  });
  return Promise.all(promises);
}


/* ============================================
   MOBILE TILT PARALLAX
   ============================================ */

/**
 * Initialize subtle device-tilt parallax effect on the logo.
 * Only active on mobile (below mobileBreakpoint).
 */
function initMobileTilt() {
  var logo = document.getElementById(HERO_CONFIG.logoId);
  if (!logo) return;

  // Check for DeviceOrientationEvent support
  if (!window.DeviceOrientationEvent) return;

  // iOS 13+ requires permission
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // We'll add the tilt on first user interaction
    var handler = function() {
      DeviceOrientationEvent.requestPermission().then(function(state) {
        if (state === 'granted') {
          attachTiltListener(logo);
        }
      }).catch(function() {});
      document.removeEventListener('touchstart', handler);
    };
    document.addEventListener('touchstart', handler, { once: true });
  } else {
    attachTiltListener(logo);
  }
}

/**
 * Attach the deviceorientation listener for tilt effect.
 */
function attachTiltListener(logo) {
  var lastUpdate = 0;
  var throttleMs = 50;  // ~20fps is sufficient for subtle tilt

  tiltHandler = function(e) {
    var now = Date.now();
    if (now - lastUpdate < throttleMs) return;
    lastUpdate = now;

    if (e.gamma === null || e.beta === null) return;

    var range = HERO_CONFIG.tiltSensorRange;
    var maxDeg = HERO_CONFIG.tiltMaxDeg;

    // gamma = left/right tilt (-90 to 90)
    var tiltX = Math.max(-range, Math.min(range, e.gamma)) / range;
    // beta = front/back tilt (0 to 360), normalize around ~45° (natural phone hold angle)
    var tiltY = Math.max(-range, Math.min(range, e.beta - 45)) / range;

    logo.style.transform = 'perspective(500px) rotateY(' + (tiltX * maxDeg).toFixed(1) + 'deg) rotateX(' + (-tiltY * maxDeg * 0.6).toFixed(1) + 'deg)';
  };

  window.addEventListener('deviceorientation', tiltHandler);
}


/* ============================================
   VISIBILITY API
   Pause/resume when tab visibility changes
   ============================================ */

function handleVisibilityChange() {
  if (document.hidden) {
    stopSpawning();
  } else if (manifest && window.innerWidth >= HERO_CONFIG.mobileBreakpoint) {
    startSpawning();
  }
}


/* ============================================
   RESIZE HANDLING
   ============================================ */

var resizeTimer = null;

function handleResize() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    var isMobile = window.innerWidth < HERO_CONFIG.mobileBreakpoint;

    if (isMobile && isRunning) {
      // Crossed to mobile: stop orbit, start tilt
      stopSpawning();
      initMobileTilt();
    } else if (!isMobile && !isRunning && manifest) {
      // Crossed to desktop: stop tilt, start orbit
      removeTiltListener();
      startSpawning();
    }
  }, 200);
}

function removeTiltListener() {
  if (tiltHandler) {
    window.removeEventListener('deviceorientation', tiltHandler);
    tiltHandler = null;
    // Reset logo transform
    var logo = document.getElementById(HERO_CONFIG.logoId);
    if (logo) {
      logo.style.transform = '';
    }
  }
}


/* ============================================
   CLEANUP
   ============================================ */

/**
 * Full cleanup - used on SPA navigation away from home.
 */
function cleanup() {
  stopSpawning();
  removeTiltListener();

  // Remove all spawned objects from DOM
  var container = document.getElementById(HERO_CONFIG.containerId);
  if (container) {
    container.innerHTML = '';
  }

  activeCount = 0;
  recentlyUsed = [];

  // Remove event listeners
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('resize', handleResize);

  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
}


/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Main initialization function.
 * Fetches manifest, preloads images, starts appropriate animation mode.
 */
async function heroKaleidoscopeInit() {
  // Clean up any previous state (SPA re-navigation)
  cleanup();

  // Check reduced motion preference
  if (prefersReducedMotion()) {
    DurtNursUtils.debug('[Hero Kaleidoscope] Reduced motion preferred, skipping animation');
    return;
  }

  // Check for container
  var container = document.getElementById(HERO_CONFIG.containerId);
  if (!container) {
    DurtNursUtils.debug('[Hero Kaleidoscope] Container not found, skipping');
    return;
  }

  // Check offset-path support
  supportsOffsetPath = checkOffsetPathSupport();
  DurtNursUtils.debug('[Hero Kaleidoscope] offset-path supported:', supportsOffsetPath);

  // Fetch manifest
  try {
    manifest = await DurtNursUtils.fetchJSON(HERO_CONFIG.manifestUrl);
  } catch (err) {
    DurtNursUtils.debugError('[Hero Kaleidoscope] Failed to load manifest:', err);
    return;
  }

  if (!manifest || !manifest.objects || manifest.objects.length === 0) {
    DurtNursUtils.debug('[Hero Kaleidoscope] No hero objects found in manifest');
    return;
  }

  DurtNursUtils.debug('[Hero Kaleidoscope] Loaded', manifest.objects.length, 'objects');

  // Preload all images
  await preloadImages(manifest.objects);
  DurtNursUtils.debug('[Hero Kaleidoscope] Images preloaded');

  // Register event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('resize', handleResize);

  // Start appropriate mode based on viewport
  if (window.innerWidth >= HERO_CONFIG.mobileBreakpoint) {
    // Desktop/Tablet: orbit animation
    startSpawning();
  } else {
    // Mobile: tilt parallax
    initMobileTilt();
  }
}

/* ============================================
   AUTO-INITIALIZATION
   ============================================ */

DurtNursUtils.onDOMReady(heroKaleidoscopeInit);

// Register with SPA navigation for cleanup/reinit
if (typeof DurtNursSPA !== 'undefined') {
  DurtNursSPA.registerModule('hero-kaleidoscope', heroKaleidoscopeInit, {
    pages: ['home']
  });
}
