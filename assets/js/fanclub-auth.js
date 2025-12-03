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
 * The access code required to view Fan Club content
 *
 * SECURITY NOTE: This is visible in the source code!
 * Anyone who views this file can see the code.
 * This is intentional - we're not trying to hide it from determined users.
 * We're just creating a "members only" feeling.
 *
 * The code "KRAKEN" references the band's album "Release the Kraken!"
 * It's memorable for approved fans and fits the band's aesthetic.
 *
 * To change the code:
 * 1. Update this value
 * 2. Commit and push changes
 * 3. Notify approved fans of the new code
 */
const FANCLUB_CODE = 'KRAKEN';

/**
 * Storage key for authentication status
 *
 * We use sessionStorage (not localStorage) because:
 * - sessionStorage clears when browser closes
 * - localStorage persists until manually cleared
 * - For casual gatekeeping, session-based is appropriate
 * - Users will need to re-enter code each browser session
 *
 * Why this is good:
 * - Balances convenience with access control
 * - If someone leaves their computer unlocked, closing browser ends access
 * - Still convenient for users during their session
 *
 * sessionStorage API:
 * - setItem(key, value): Store value
 * - getItem(key): Retrieve value
 * - removeItem(key): Delete value
 * - clear(): Delete all stored data
 * - Only accessible from same origin (domain)
 * - Only accessible via JavaScript (not HTTP headers)
 */
const AUTH_KEY = 'durtnurs_fanclub_auth';

/**
 * Array of humorous error messages
 * Randomly selected when user enters wrong code
 * Maintains band's personality even in error states
 */
const ERROR_MESSAGES = [
  "Nope. Try again or forever be shunned.",
  "That's not it. Did you even talk to us?",
  "Wrong. We question your dedication.",
  "Not even close. Are you even a real fan?",
  "Nice try, poser.",
  "Swing and a miss. Strike one.",
  "The Kraken remains unleashed... by you, apparently not.",
  "Access denied. Go listen to the album again.",
  "If you can't remember the code, you don't deserve what's behind it.",
  "Wrong answer. This is why we can't have nice things."
];

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
  const authStatus = sessionStorage.getItem(AUTH_KEY);

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
 * Side effects:
 * - Writes to sessionStorage
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
  sessionStorage.setItem(AUTH_KEY, 'authenticated');

  console.log('✅ Access granted - authentication stored in sessionStorage');

  // Show the protected content
  showContent();

  // Hide the access prompt overlay
  hidePrompt();
}

/**
 * Handles incorrect access code attempts
 *
 * Called when user enters wrong code.
 * Displays a random humorous error message.
 * Keeps prompt visible so user can try again.
 *
 * No attempt limiting:
 * - User can try unlimited times
 * - No lockout mechanism
 * - No rate limiting
 * - This is fine for casual gatekeeping
 * - If this were protecting sensitive data, we'd add attempt limits
 *
 * @param {string} attemptedCode - The code the user entered (for logging)
 */
function denyAccess(attemptedCode) {
  // Log the failed attempt (helps with debugging)
  // In production security system, you'd log to server
  console.warn(`❌ Access denied - incorrect code: "${attemptedCode}"`);

  // Select a random error message
  // Math.random() returns number between 0 and 1
  // Multiply by array length and floor to get random index
  const randomIndex = Math.floor(Math.random() * ERROR_MESSAGES.length);
  const errorMessage = ERROR_MESSAGES[randomIndex];

  // Display the error message
  displayError(errorMessage);

  // Keep focus on input so user can try again
  const input = document.getElementById('fanclub-code-input');
  if (input) {
    input.select(); // Selects all text in input for easy replacement
  }
}

// =============================================================================
// UI MANIPULATION FUNCTIONS
// =============================================================================

/**
 * Displays error message to user
 *
 * Updates the error message element with text and makes it visible.
 * Uses visibility instead of display for accessibility:
 * - Screen readers will announce visible errors
 * - Maintains layout space (prevents content shift)
 *
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const errorElement = document.getElementById('fanclub-auth-error');

  // Defensive check: Ensure element exists before manipulating
  if (!errorElement) {
    console.warn('⚠️ Error element not found');
    return;
  }

  // Set the error message text
  errorElement.textContent = message;

  // Make error visible
  // Using .visible class instead of inline styles keeps styling in CSS
  errorElement.classList.add('visible');

  // Set ARIA attribute for accessibility
  // role="alert" causes screen readers to announce the error immediately
  errorElement.setAttribute('role', 'alert');
}

/**
 * Clears any displayed error message
 *
 * Hides error element and clears its text.
 * Called when user submits a new attempt.
 */
function clearError() {
  const errorElement = document.getElementById('fanclub-auth-error');

  if (errorElement) {
    errorElement.classList.remove('visible');
    errorElement.textContent = '';
    errorElement.removeAttribute('role');
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
 * Called when user submits the access code form.
 * Prevents default form behavior, validates input, and checks code.
 *
 * Form Handling Best Practices:
 * - Always preventDefault() to stop page reload
 * - Validate and sanitize input
 * - Provide clear feedback (success or error)
 * - Keep focus management accessible
 *
 * @param {Event} event - Form submit event object
 */
function handleFormSubmit(event) {
  // Prevent default form submission
  // Without this, form would reload the page (traditional form behavior)
  // We want to handle submission with JavaScript instead
  event.preventDefault();

  console.log('📝 Form submitted');

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
    displayError('You need to actually enter something. Nice try.');
    return;
  }

  // Verify the code
  // Compare entered code with stored code (both uppercase)
  if (enteredCode === FANCLUB_CODE.toUpperCase()) {
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

/**
 * Wait for DOM to be fully loaded before running code
 *
 * DOMContentLoaded event fires when HTML is fully parsed.
 * This ensures all elements exist before we try to access them.
 *
 * Why check readyState?
 * - If script loads after DOM is ready, event won't fire
 * - Checking readyState catches this case
 * - Ensures initialization happens regardless of script timing
 *
 * readyState values:
 * - "loading": Document still loading
 * - "interactive": DOM ready, resources still loading
 * - "complete": Everything loaded
 */
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', initAuth);
  console.log('⏳ Waiting for DOM to load...');
} else {
  // DOM is already loaded, initialize immediately
  initAuth();
}

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
