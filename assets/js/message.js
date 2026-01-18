/**
 * MESSAGE MODULE
 * Handles humorous dead-end message pages with timer and redirect
 *
 * This module demonstrates:
 * - URL parameter parsing (reading query strings)
 * - Timer management with setInterval/clearInterval
 * - DOM manipulation for dynamic content
 * - Progressive enhancement (works without JavaScript via noscript)
 * - Error handling for invalid/missing parameters
 * - Cleanup on navigation (clearing timers)
 *
 * User Experience Flow:
 * 1. User clicks announcement link → navigates to message.html?type=something
 * 2. JavaScript reads the 'type' parameter from the URL
 * 3. Appropriate humorous message is displayed
 * 4. 7-second countdown timer starts
 * 5. After 7 seconds, auto-redirect to news.html
 * 6. "Get Me Out of Here" button provides immediate exit
 */

// =============================================================================
// MESSAGE CONFIGURATION
// =============================================================================

/**
 * Message configuration object
 * Maps URL parameter types to humorous messages
 *
 * This object uses key-value pairs where:
 * - Key: the 'type' parameter from the URL
 * - Value: the humorous message to display
 *
 * Based on discovered link types in announcements.json:
 * - "Read More →" (default for announcements without links)
 * - "Pre-order Album"
 * - "View Tour Dates"
 * - "Listen on Spotify"
 */
const MESSAGE_CONFIG = {
  // Default message for "Read More" links
  'read-more': "Well... there's really nothing more to add so... goodbye",

  // Pre-order album message (humorous rejection)
  'pre-order': "Yeah, as if. But feel free to send cash anyway",

  // Tour dates message (personal invitation)
  'tour-dates': "Call us. We'll come visit",

  // Spotify message (absurdist alternative)
  'spotify': "Best to do what we do. Close your eyes and just imagine what it sounds like",

  // Fallback for unknown types
  'default': "You've wandered into uncharted territory. Impressive. But there's nothing here."
};

/**
 * Timer configuration
 * Constants for countdown timer behavior
 */
const COUNTDOWN_DURATION = 7; // seconds
const REDIRECT_URL = 'news.html';

// =============================================================================
// URL PARAMETER PARSING
// =============================================================================

/**
 * Reads the 'type' parameter from the current page URL
 *
 * URL Structure Example: message.html?type=read-more
 * - The '?' starts the query string
 * - Parameters are in format: name=value
 * - Multiple parameters separated by '&'
 *
 * URLSearchParams is a built-in browser API that makes it easy
 * to work with query strings without manual string parsing.
 *
 * @returns {string} The type parameter value (e.g., 'read-more')
 */
function getMessageType() {
  // window.location.search returns the query string portion of the URL
  // Example: if URL is "message.html?type=read-more", this returns "?type=read-more"
  const queryString = window.location.search;

  console.log('🔍 Reading URL parameters:', queryString);

  // URLSearchParams parses the query string into a searchable object
  // It automatically handles URL decoding (e.g., %20 → space)
  const params = new URLSearchParams(queryString);

  // get() method retrieves the value of a specific parameter
  // Returns null if the parameter doesn't exist
  const type = params.get('type');

  console.log('📝 Message type:', type || 'none (will use default)');

  // Return the type, or null if not found
  // The calling function will handle the null case
  return type;
}

/**
 * Gets the appropriate message based on the type parameter
 * Falls back to default message if type is invalid or missing
 *
 * @param {string|null} type - The message type from URL parameter
 * @returns {string} The humorous message to display
 */
function getMessageForType(type) {
  // If no type provided, use default
  if (!type) {
    console.log('⚠️ No type parameter found, using default message');
    return MESSAGE_CONFIG.default;
  }

  // Check if we have a message for this type
  // The 'in' operator checks if a property exists in an object
  if (type in MESSAGE_CONFIG) {
    console.log(`✅ Found message for type: ${type}`);
    return MESSAGE_CONFIG[type];
  }

  // Type exists but we don't have a message for it
  console.log(`⚠️ Unknown message type: ${type}, using default`);
  return MESSAGE_CONFIG.default;
}

// =============================================================================
// DOM MANIPULATION
// =============================================================================

/**
 * Updates the message text on the page
 *
 * This function finds the message element and replaces its content
 * with the appropriate humorous message based on the URL parameter
 */
function displayMessage() {
  console.log('💬 Displaying message...');

  // Find the message text element by its ID
  const messageElement = document.getElementById('message-text');

  // Defensive programming: check if element exists
  // This prevents errors if the HTML structure changes
  if (!messageElement) {
    console.error('❌ Message element not found!');
    return;
  }

  // Get the message type from the URL
  const type = getMessageType();

  // Get the appropriate message for this type
  const message = getMessageForType(type);

  // Update the element's text content
  // textContent is safer than innerHTML as it prevents XSS attacks
  // (though in this case we control all the messages, so it's not a risk)
  messageElement.textContent = message;

  console.log('✅ Message displayed');
}

// =============================================================================
// COUNTDOWN TIMER
// =============================================================================

/**
 * Global timer variable
 * We store the interval ID so we can clear it later
 *
 * Why global? We need to access this from multiple functions:
 * - startCountdown() sets it
 * - cleanup() clears it
 * - The exit button handler clears it
 */
let countdownInterval = null;

/**
 * Starts the countdown timer and handles auto-redirect
 *
 * This function uses setInterval to update the countdown every second.
 * setInterval is a JavaScript function that repeatedly calls a function
 * at a specified time interval (in milliseconds).
 *
 * Timer Flow:
 * 1. Display initial countdown (7)
 * 2. Every second: decrement and update display
 * 3. When reaches 0: stop timer and redirect
 */
function startCountdown() {
  console.log('⏱️ Starting countdown timer...');

  // Find the countdown display element
  const countdownElement = document.getElementById('timer-countdown');

  if (!countdownElement) {
    console.error('❌ Countdown element not found!');
    return;
  }

  // Initialize countdown value
  let secondsRemaining = COUNTDOWN_DURATION;

  // Update display with initial value
  countdownElement.textContent = secondsRemaining;

  // setInterval calls the provided function every X milliseconds
  // 1000 milliseconds = 1 second
  // It returns an interval ID that we can use to stop it later
  countdownInterval = setInterval(() => {
    // Decrement the seconds remaining
    secondsRemaining--;

    console.log(`⏳ Countdown: ${secondsRemaining} seconds remaining`);

    // Update the display
    countdownElement.textContent = secondsRemaining;

    // Check if countdown has finished
    if (secondsRemaining <= 0) {
      console.log('🚀 Countdown complete! Redirecting...');

      // Stop the interval from running again
      // clearInterval stops a setInterval timer
      clearInterval(countdownInterval);

      // Redirect to the news page
      // window.location.href changes the current page URL
      // This is equivalent to clicking a link
      window.location.href = REDIRECT_URL;
    }
  }, 1000); // Run every 1000ms (1 second)

  console.log('✅ Countdown timer started');
}

// =============================================================================
// EXIT BUTTON HANDLER
// =============================================================================

/**
 * Sets up the exit button to stop the timer and redirect immediately
 *
 * Without this cleanup, the timer would keep running even after
 * the user clicks the exit button, which could cause issues.
 */
function setupExitButton() {
  console.log('🚪 Setting up exit button...');

  const exitButton = document.getElementById('message-exit');

  if (!exitButton) {
    console.error('❌ Exit button not found!');
    return;
  }

  // Add click event listener
  // We use addEventListener instead of onclick for better practice
  // addEventListener allows multiple handlers and better control
  exitButton.addEventListener('click', (event) => {
    console.log('👆 Exit button clicked');

    // Stop the countdown timer
    // This prevents the timer from continuing after we leave the page
    if (countdownInterval) {
      clearInterval(countdownInterval);
      console.log('⏹️ Timer stopped');
    }

    // Note: We don't need to preventDefault() here because
    // the button is already an <a> tag with href="news.html"
    // The browser will naturally navigate to that URL
  });

  console.log('✅ Exit button ready');
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Cleanup function to stop the timer when the page unloads
 *
 * This is good practice to prevent memory leaks and unexpected behavior.
 * Even though the page is unloading, it's important to clean up timers.
 */
function cleanup() {
  if (countdownInterval) {
    console.log('🧹 Cleaning up timer on page unload');
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the message page
 * Called when the DOM is ready
 *
 * Initialization steps:
 * 1. Display the appropriate message based on URL parameter
 * 2. Start the countdown timer
 * 3. Set up the exit button handler
 * 4. Register cleanup handler for page unload
 */
function init() {
  console.log('🚀 Initializing message page...');

  // Display the message
  displayMessage();

  // Start the countdown timer
  startCountdown();

  // Set up exit button
  setupExitButton();

  // Register cleanup handler
  // beforeunload fires when the user is about to leave the page
  // This could be from clicking a link, closing the tab, or the timer redirect
  window.addEventListener('beforeunload', cleanup);

  console.log('✅ Message page initialized successfully');
}

// =============================================================================
// AUTO-INITIALIZATION
// =============================================================================

// Wait for DOM to be fully loaded before running code
DurtNursUtils.onDOMReady(init);
