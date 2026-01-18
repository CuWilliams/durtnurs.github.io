/**
 * FAN CLUB AUTHENTICATION MODULE
 * Client-side access code protection for casual gatekeeping
 *
 * IMPORTANT SECURITY DISCLAIMER:
 * ================================
 * This is NOT secure authentication. This is intentional.
 *
 * What this is:
 * - Casual gatekeeping among friends
 * - Creates "members only" feeling
 * - Prevents casual visitors from stumbling upon private content
 * - Prevents search engines from indexing (via robots.txt + meta tags)
 *
 * What this is NOT:
 * - Secure authentication
 * - Protection against anyone who views page source
 * - Protection against developers using browser inspector
 * - Fort Knox
 *
 * The access code is visible in this JavaScript file to anyone who looks.
 * This is EXPECTED BEHAVIOR for this use case.
 *
 * For real security, you would need:
 * - Server-side authentication
 * - Password hashing
 * - Database to store user credentials
 * - HTTPS encryption
 * - Session management with secure tokens
 * - Services like Cloudflare Access, Auth0, or similar
 *
 * But for a hobby band website among close friends? This is perfect.
 *
 * Learning Topics Covered:
 * - sessionStorage vs localStorage
 * - Form submission handling
 * - DOM manipulation for showing/hiding content
 * - Event listeners (submit, keydown)
 * - Input validation and sanitization
 * - Focus management for accessibility
 * - Simple obfuscation (not encryption)
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration object for authentication system
 * Centralized settings for easy modification
 *
 * PHASE 8 UPDATE: Added attempt limits and redirect timing
 */
const CONFIG = {
  /**
   * The access code required to view Fan Club content
   *
   * SECURITY NOTE: This is visible in the source code!
   * Anyone who views this file can see the code.
   * This is intentional - we're not trying to hide it from determined users.
   * We're just creating a "members only" feeling.
   *
   * The code "KRAKEN" references the band's album "Release the Kraken!"
   * It's memorable for approved fans and fits the band's aesthetic.
   */
  accessCode: 'KRAKEN',

  /**
   * Maximum failed attempts before "drunk redirect"
   * After this many failures, user gets kicked back to homepage
   *
   * Why 3?
   * - Gives users reasonable chance to get it right
   * - Adds humor through the "you're drunk" joke
   * - They can return and try again (not a permanent ban)
   */
  maxAttempts: 3,

  /**
   * Milliseconds before redirect happens
   * 5000ms = 5 seconds gives user time to read message
   */
  redirectDelay: 5000,

  /**
   * Storage key for authentication status
   *
   * We use sessionStorage (not localStorage) because:
   * - sessionStorage clears when browser closes
   * - localStorage persists until manually cleared
   * - For casual gatekeeping, session-based is appropriate
   * - Users will need to re-enter code each browser session
   */
  storageKey: 'durtnurs_fanclub_auth'
};

/**
 * Array of humorous error messages
 *
 * PHASE 8 UPDATE: Messages now escalate in absurdity!
 * - Attempt 1: Gentle ribbing
 * - Attempt 2: More pointed reference to album
 * - Attempt 3+: Peak absurdity
 *
 * Messages are selected based on attempt number (not random)
 * This creates escalating humor that builds anticipation
 * for the "drunk redirect" punchline
 */
const ERROR_MESSAGES = [
  "Nope. That ain't it. Try again, genius.",
  "Still wrong. Did you even listen to 'Release the Kraken'?",
  "Strike three coming up. Last chance before we assume you're hammered...",
  "Wrong again. You sure you're not already drunk?",
  "Seriously? The code is literally in the album title.",
  "Nice try. Go sober up and come back later."
];

/**
 * "Drunk redirect" message
 * Shown after max attempts before redirecting to homepage
 *
 * This is the punchline to the escalating error messages
 * Maintains band's humor while enforcing attempt limit
 */
const DRUNK_MESSAGE = "Alright, you're obviously drunk. Go sober up and come back later.";

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Attempt counter
 *
 * PHASE 8 UPDATE: Track failed login attempts
 *
 * Why in-memory variable instead of sessionStorage?
 * - We WANT it to reset on page refresh (fresh start)
 * - We DON'T want to persist across sessions
 * - Simpler and appropriate for this use case
 *
 * Counter increments on each failed attempt
 * Resets to 0 on successful login
 * After reaching maxAttempts, triggers drunk redirect
 */
let attemptCount = 0;

/**
 * Redirect timer ID
 *
 * PHASE 8 UPDATE: Store setTimeout ID for cleanup
 *
 * Why store this?
 * - Allows us to clear timer if user submits again during countdown
 * - Prevents multiple timers running simultaneously
 * - Good defensive programming (prevent memory leaks)
 *
 * Set when drunk redirect starts
 * Cleared if user triggers new action before redirect completes
 */
let redirectTimer = null;

// =============================================================================
// AUTHENTICATION CHECK FUNCTIONS
// =============================================================================

/**
 * Checks if user has valid authentication
 *
 * Returns true if user has previously authenticated in this browser session.
 * Returns false if user has not authenticated or if session has expired.
 *
 * How it works:
 * 1. Attempts to retrieve auth status from sessionStorage
 * 2. Checks if the value matches our authenticated flag
 * 3. Returns boolean result
 *
 * Why === instead of ==:
 * - === checks value AND type (strict equality)
 * - == only checks value, allows type coercion
 * - Always use === for predictable behavior
 *
 * @returns {boolean} True if authenticated, false otherwise
 */
function isAuthenticated() {
  // sessionStorage.getItem() returns:
  // - The stored value if key exists
  // - null if key doesn't exist
  const authStatus = sessionStorage.getItem(CONFIG.storageKey);

  // Check if auth status matches our authenticated flag
  const authenticated = authStatus === 'authenticated';

  // Log for debugging (helps developers understand flow)
  console.log(`🔐 Auth check: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);

  return authenticated;
}

/**
 * Stores successful authentication in sessionStorage
 *
 * Called when user enters correct access code.
 * Sets a flag in sessionStorage that persists until browser closes.
 *
 * PHASE 8 UPDATE: Resets attempt counter on success
 *
 * Side effects:
 * - Writes to sessionStorage
 * - Resets attempt counter
 * - Shows content and hides prompt
 * - Logs to console
 *
 * Why a simple flag?
 * - We're not storing sensitive data
 * - Just need to remember "user entered the code"
 * - More complex systems would store tokens, expiration times, etc.
 */
function grantAccess() {
  // Store authentication flag
  // Value doesn't matter much - we just check if it exists and equals this string
  sessionStorage.setItem(CONFIG.storageKey, 'authenticated');

  // Reset attempt counter (fresh start for next session)
  attemptCount = 0;

  console.log('✅ Access granted - authentication stored in sessionStorage');

  // Show the protected content
  showContent();

  // Hide the access prompt overlay
  hidePrompt();
}

/**
 * Handles incorrect access code attempts
 *
 * PHASE 8 UPDATE: Complete rewrite with attempt limiting!
 *
 * Called when user enters wrong code.
 * Tracks attempt count and displays escalating error messages.
 * After maxAttempts, triggers "drunk redirect" to homepage.
 *
 * Key changes from Phase 6:
 * - Increments attempt counter (was: no tracking)
 * - Escalating messages (was: random selection)
 * - Attempt limit with redirect (was: unlimited tries)
 * - Drunk redirect after 3 failures (was: no consequence)
 *
 * @param {string} attemptedCode - The code the user entered (for logging)
 */
function denyAccess(attemptedCode) {
  // Log the failed attempt (helps with debugging)
  // In production security system, you'd log to server
  console.warn(`❌ Access denied - incorrect code: "${attemptedCode}"`);

  // Increment attempt counter
  attemptCount++;

  console.log(`📊 Failed attempts: ${attemptCount} / ${CONFIG.maxAttempts}`);

  // Check if user has reached max attempts
  if (attemptCount >= CONFIG.maxAttempts) {
    // User has failed too many times - trigger drunk redirect
    handleDrunkRedirect();
  } else {
    // User still has attempts left - show escalating error message
    showErrorMessage(attemptCount);
    clearInput();
  }
}

/**
 * Displays escalating error message based on attempt number
 *
 * PHASE 8 UPDATE: New function for escalating messages
 *
 * Instead of random selection (Phase 6), we now pick messages
 * based on attempt number to create escalating absurdity.
 *
 * Message selection:
 * - Attempt 1 gets ERROR_MESSAGES[0] (gentle)
 * - Attempt 2 gets ERROR_MESSAGES[1] (pointed)
 * - Attempt 3+ wraps around if more messages exist
 *
 * Escalation pattern creates narrative tension:
 * "You got it wrong" → "Did you listen to the album?" → "Last chance!"
 *
 * @param {number} attempt - Current attempt number (1-indexed)
 */
function showErrorMessage(attempt) {
  const messageEl = document.getElementById('fanclub-auth-error');

  if (!messageEl) {
    console.warn('⚠️ Error message element not found');
    return;
  }

  // Get appropriate error message based on attempt number
  // Subtract 1 because array is 0-indexed but attempts are 1-indexed
  // Use modulo to wrap around if more attempts than messages
  const messageIndex = (attempt - 1) % ERROR_MESSAGES.length;
  const message = ERROR_MESSAGES[messageIndex];

  // Update element with error message
  messageEl.textContent = message;
  messageEl.className = 'fanclub-auth__error visible';

  // Set ARIA attribute for accessibility
  // role="alert" causes screen readers to announce immediately
  messageEl.setAttribute('role', 'alert');

  console.log(`💬 Displaying error message #${attempt}: "${message}"`);
}

/**
 * Handles "drunk redirect" after max attempts
 *
 * PHASE 8 UPDATE: New function for drunk redirect feature
 *
 * After maxAttempts failures, we assume user is drunk and redirect
 * them back to homepage with humorous message and countdown.
 *
 * Process:
 * 1. Display drunk message with countdown
 * 2. Disable form submission (can't submit during countdown)
 * 3. Update countdown every second
 * 4. Redirect to homepage after delay
 * 5. User can return and try again (counter resets)
 *
 * Why this works:
 * - Adds humor to error handling
 * - Prevents infinite retry loops
 * - Gives user clear feedback about what's happening
 * - Countdown shows exactly when redirect will happen
 * - Not permanent (user can return immediately)
 */
function handleDrunkRedirect() {
  const messageEl = document.getElementById('fanclub-auth-error');

  if (!messageEl) {
    console.warn('⚠️ Error message element not found');
    return;
  }

  // Calculate countdown in seconds
  let countdown = Math.floor(CONFIG.redirectDelay / 1000);

  // Display drunk message with initial countdown
  messageEl.className = 'fanclub-auth__error fanclub-auth__error--drunk visible';
  messageEl.innerHTML = `
    ${DRUNK_MESSAGE}
    <span class="fanclub-auth__countdown">Redirecting in ${countdown}...</span>
  `;

  // Disable form submission during redirect countdown
  const submitBtn = document.querySelector('.fanclub-auth__submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
  }

  console.log('🍺 Drunk redirect initiated - user will be redirected in 5 seconds');

  // Update countdown every second
  const countdownInterval = setInterval(() => {
    countdown--;
    const countdownEl = messageEl.querySelector('.fanclub-auth__countdown');
    if (countdownEl && countdown > 0) {
      countdownEl.textContent = `Redirecting in ${countdown}...`;
    }
  }, 1000);

  // Redirect after delay
  redirectTimer = setTimeout(() => {
    clearInterval(countdownInterval);
    console.log('🏠 Redirecting to homepage...');
    window.location.href = 'index.html';
  }, CONFIG.redirectDelay);
}

// =============================================================================
// UI MANIPULATION FUNCTIONS
// =============================================================================

/**
 * Clears any displayed error or message
 *
 * PHASE 8 UPDATE: Enhanced to handle all message states
 *
 * Hides message element and clears its content.
 * Called when user submits a new attempt.
 *
 * Now clears:
 * - Regular error messages
 * - Drunk redirect messages
 * - Countdown timers (innerHTML)
 * - ARIA attributes
 */
function clearError() {
  const errorElement = document.getElementById('fanclub-auth-error');

  if (errorElement) {
    // Remove all possible classes
    errorElement.className = 'fanclub-auth__error';

    // Clear content (handles both textContent and innerHTML)
    errorElement.textContent = '';
    errorElement.innerHTML = '';

    // Remove ARIA attribute
    errorElement.removeAttribute('role');
  }
}

/**
 * Clears and refocuses the input field
 *
 * PHASE 8 UPDATE: New helper function
 *
 * Clears the input field after failed attempt and keeps focus
 * for immediate retry. Improves UX by:
 * - Removing incorrect input
 * - Keeping focus in field (no need to click back)
 * - Allowing immediate new attempt
 */
function clearInput() {
  const input = document.getElementById('fanclub-code-input');

  if (input) {
    input.value = '';
    input.focus();
    // select() would select all text, but field is empty now
    // focus() just moves cursor to the field
  }
}

/**
 * Shows the Fan Club content
 *
 * Removes the .hidden class from the main content container.
 * Content becomes visible via CSS.
 *
 * Why use class instead of inline style?
 * - Separates concerns (behavior vs presentation)
 * - Easier to maintain
 * - Can apply transitions via CSS
 * - More flexible for responsive design
 */
function showContent() {
  const content = document.querySelector('.fanclub-content');

  if (content) {
    content.classList.remove('hidden');
    console.log('📖 Fan Club content is now visible');
  } else {
    console.warn('⚠️ Fan Club content container not found');
  }
}

/**
 * Hides the access prompt overlay
 *
 * Removes overlay from view after successful authentication.
 * Uses .hidden class which sets display: none in CSS.
 */
function hidePrompt() {
  const prompt = document.querySelector('.fanclub-auth');

  if (prompt) {
    prompt.classList.add('hidden');
    console.log('🚪 Access prompt hidden');
  } else {
    console.warn('⚠️ Access prompt element not found');
  }
}

/**
 * Shows the access prompt overlay
 *
 * Makes overlay visible if user is not authenticated.
 * Hides main content until authentication succeeds.
 */
function showPrompt() {
  const prompt = document.querySelector('.fanclub-auth');

  if (prompt) {
    prompt.classList.remove('hidden');
    console.log('🔒 Access prompt displayed');

    // Focus the input field for immediate user interaction
    // setTimeout ensures DOM is ready before focusing
    setTimeout(() => {
      const input = document.getElementById('fanclub-code-input');
      if (input) {
        input.focus();
      }
    }, 100);
  } else {
    console.warn('⚠️ Access prompt element not found');
  }
}

// =============================================================================
// FORM HANDLING
// =============================================================================

/**
 * Handles form submission
 *
 * PHASE 8 UPDATE: Added redirect timer cleanup
 *
 * Called when user submits the access code form.
 * Prevents default form behavior, validates input, and checks code.
 *
 * Form Handling Best Practices:
 * - Always preventDefault() to stop page reload
 * - Validate and sanitize input
 * - Provide clear feedback (success or error)
 * - Keep focus management accessible
 * - Clean up timers before starting new operations
 *
 * @param {Event} event - Form submit event object
 */
function handleFormSubmit(event) {
  // Prevent default form submission
  // Without this, form would reload the page (traditional form behavior)
  // We want to handle submission with JavaScript instead
  event.preventDefault();

  console.log('📝 Form submitted');

  // PHASE 8: Clear any existing redirect timer
  // If user submits during countdown, cancel the redirect
  if (redirectTimer) {
    clearTimeout(redirectTimer);
    redirectTimer = null;
    console.log('⏹️ Redirect timer cleared');
  }

  // Clear any existing error message
  clearError();

  // Get the input element
  const input = document.getElementById('fanclub-code-input');

  // Defensive check
  if (!input) {
    console.error('❌ Input element not found');
    return;
  }

  // Get the entered code and sanitize it
  let enteredCode = input.value;

  // Sanitization steps:
  // 1. trim() removes whitespace from beginning and end
  //    "  KRAKEN  " becomes "KRAKEN"
  // 2. toUpperCase() normalizes case for comparison
  //    "kraken" becomes "KRAKEN"
  //    Makes code entry case-insensitive (better UX)
  enteredCode = enteredCode.trim().toUpperCase();

  // Check for empty input
  if (enteredCode === '') {
    // Show error message for empty submission
    const messageEl = document.getElementById('fanclub-auth-error');
    if (messageEl) {
      messageEl.textContent = 'You need to actually enter something. Nice try.';
      messageEl.className = 'fanclub-auth__error visible';
      messageEl.setAttribute('role', 'alert');
    }
    return;
  }

  // Verify the code
  // Compare entered code with stored code (both uppercase)
  if (enteredCode === CONFIG.accessCode.toUpperCase()) {
    // Correct code!
    console.log('✅ Correct code entered');
    grantAccess();
  } else {
    // Wrong code
    console.log('❌ Incorrect code entered');
    denyAccess(enteredCode);
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the authentication system
 *
 * This is the main entry point for the module.
 * Called when DOM is ready.
 *
 * Initialization steps:
 * 1. Check if user is already authenticated
 * 2. Show appropriate UI (content or prompt)
 * 3. Attach event listeners
 * 4. Set up keyboard shortcuts
 * 5. Manage focus for accessibility
 */
function initAuth() {
  console.log('🚀 Initializing Fan Club authentication...');

  // Check current authentication status
  if (isAuthenticated()) {
    // User is already authenticated in this session
    // Show content, hide prompt
    console.log('✅ User already authenticated');
    showContent();
    hidePrompt();
  } else {
    // User is not authenticated
    // Hide content, show prompt
    console.log('🔒 User not authenticated - showing access prompt');
    showPrompt();

    // Ensure content is hidden
    const content = document.querySelector('.fanclub-content');
    if (content) {
      content.classList.add('hidden');
    }
  }

  // Attach form submit handler
  // Find the form element
  const form = document.getElementById('fanclub-auth-form');

  if (form) {
    // Add submit event listener
    // This fires when user clicks submit button OR presses Enter in input
    form.addEventListener('submit', handleFormSubmit);
    console.log('✅ Form submit handler attached');
  } else {
    console.warn('⚠️ Auth form not found - authentication may not work');
  }

  // Additional keyboard shortcuts (optional enhancement)
  // Listen for Escape key to help user exit if needed
  document.addEventListener('keydown', (event) => {
    // If user presses Escape while on Fan Club page
    if (event.key === 'Escape') {
      // Could add functionality here, like:
      // - Clear the input field
      // - Show a hint
      // - Navigate back to main gallery
      // For now, we'll just log it
      console.log('⌨️ Escape key pressed');
    }
  });

  console.log('✅ Fan Club authentication initialized');
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded before running code
DurtNursUtils.onDOMReady(initAuth);

// =============================================================================
// DEVELOPER CONSOLE MESSAGES
// =============================================================================

/**
 * Display helpful information in the browser console
 *
 * This helps developers (and curious users) understand the system.
 * It's educational and transparent about the security level.
 */
console.log('%c🎸 tHE dURT nURS\' Fan Club Authentication', 'font-size: 16px; font-weight: bold; color: #A05A24;');
console.log('%cSecurity Level: Casual Gatekeeping', 'color: #8B7A43;');
console.log('%cThe access code is visible in this file. This is intentional.', 'color: #A8A29E;');
console.log('%cFor educational purposes, here\'s what\'s happening:', 'color: #A8A29E;');
console.log('1. User enters access code');
console.log('2. Code is compared to stored value in JavaScript');
console.log('3. Success = sessionStorage flag + show content');
console.log('4. Failure = humorous error message');
console.log('5. Authentication persists until browser closes (sessionStorage)');
console.log('%cThis is NOT secure. This is casual friends-only gatekeeping.', 'color: #5B1A1A; font-weight: bold;');

// =============================================================================
// EXPORTS (for potential future module usage)
// =============================================================================

/**
 * If using ES6 modules in the future, uncomment to export functions
 * Example: import { isAuthenticated, grantAccess } from './fanclub-auth.js'
 */
// export {
//   isAuthenticated,
//   grantAccess,
//   denyAccess,
//   initAuth
// };
