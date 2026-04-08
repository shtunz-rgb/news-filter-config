/**
 * DOM utility functions for the News Filter extension
 * Version: 2.3
 */

/**
 * Get element text content with optional length limit
 * @param {Element} element - The DOM element
 * @param {number} maxLength - Maximum length of text to return
 * @returns {string} Text content in lowercase
 */
export function getElementText(element, maxLength = 500) {
  if (!element) return '';
  const text = element.textContent || '';
  return text.substring(0, maxLength).toLowerCase();
}

/**
 * Find the closest ancestor matching selectors
 * @param {Element} element - The starting element
 * @param {string} selectors - CSS selectors (comma-separated)
 * @returns {Element|null} The matching ancestor or null
 */
export function findClosestArticle(element, selectors) {
  if (!element || !selectors) return null;
  try {
    return element.closest(selectors);
  } catch (e) {
    return null;
  }
}

/**
 * Check if an element is valid and visible
 * @param {Element} element - The element to check
 * @returns {boolean} True if element is valid and visible
 */
export function isValidElement(element) {
  return element && 
         element.nodeType === Node.ELEMENT_NODE &&
         element.offsetParent !== null;
}

/**
 * Get element dimensions and position
 * @param {Element} element - The element to measure
 * @returns {object} Object with width, height, top, left properties
 */
export function getElementDimensions(element) {
  if (!element) return { width: 0, height: 0, top: 0, left: 0 };
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right
  };
}

/**
 * Get computed style properties of an element
 * @param {Element} element - The element
 * @returns {object} Object with display, flexDirection, gridTemplateColumns, etc.
 */
export function getLayoutProperties(element) {
  if (!element) return {};
  const computed = window.getComputedStyle(element);
  return {
    display: computed.display,
    flexDirection: computed.flexDirection,
    gridTemplateColumns: computed.gridTemplateColumns,
    width: element.offsetWidth,
    height: element.offsetHeight,
    position: computed.position
  };
}

/**
 * Check if element matches any of the selectors
 * @param {Element} element - The element to check
 * @param {string} selectors - CSS selectors (comma-separated)
 * @returns {boolean} True if element matches any selector
 */
export function matchesSelectors(element, selectors) {
  if (!element || !selectors) return false;
  try {
    return element.matches(selectors);
  } catch (e) {
    return false;
  }
}

/**
 * Find all elements matching selectors
 * @param {string} selectors - CSS selectors (comma-separated)
 * @param {Element} context - The context element (defaults to document)
 * @returns {NodeList} List of matching elements
 */
export function findElements(selectors, context = document) {
  if (!selectors) return [];
  try {
    return context.querySelectorAll(selectors);
  } catch (e) {
    return [];
  }
}

/**
 * Extract URL from an element
 * @param {Element} element - The element
 * @returns {string|null} The URL or null
 */
export function extractURL(element) {
  if (!element) return null;
  
  const linkElement = element.tagName === 'A' ? element : element.querySelector('a[href]');
  if (linkElement && linkElement.href) {
    return linkElement.href;
  }
  return null;
}

/**
 * Get the absolute position of an element from top of page
 * @param {Element} element - The element
 * @returns {number} Absolute position from top
 */
export function getAbsolutePosition(element) {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return rect.top + scrollTop;
}

/**
 * Check if element is in viewport
 * @param {Element} element - The element
 * @returns {boolean} True if element is visible in viewport
 */
export function isInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
