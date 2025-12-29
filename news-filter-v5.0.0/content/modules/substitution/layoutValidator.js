/**
 * Layout Validator for Phase 4: Layout-Aware Substitution
 * Determines if a replacement article is visually compatible with a filtered article
 * Version: 5.0.0
 */

import { Logger } from '../../utils/logger.js';

export class LayoutValidator {
  constructor(siteConfig = {}, options = {}) {
    this.siteConfig = siteConfig;
    this.logger = new Logger(options.debug);
    this.dimensionCache = new Map();
    this.cacheExpiry = siteConfig.substitution?.cacheExpiry || 5000; // 5 seconds
    this.defaultTolerance = {
      width: 0.15,   // ±15%
      height: 0.15,  // ±15%
      aspectRatio: 0.15
    };
  }

  /**
   * Check if a candidate element is a compatible replacement for a filtered element
   * @param {Element} filteredElement - The filtered article element
   * @param {Element} candidateElement - The potential replacement element
   * @returns {boolean} True if compatible
   */
  isCompatible(filteredElement, candidateElement) {
    if (!filteredElement || !candidateElement) {
      return false;
    }

    try {
      // Check visibility
      if (!this.isVisible(candidateElement)) {
        this.logger.log('Candidate not visible, skipping');
        return false;
      }

      // Get dimensions
      const filteredDims = this.getDimensions(filteredElement);
      const candidateDims = this.getDimensions(candidateElement);

      if (!filteredDims || !candidateDims) {
        this.logger.log('Could not get dimensions');
        return false;
      }

      // Get tolerance thresholds
      const tolerance = this.getTolerance();

      // Check width compatibility
      const widthDiff = Math.abs(filteredDims.width - candidateDims.width) / filteredDims.width;
      if (widthDiff > tolerance.width) {
        this.logger.log(`Width mismatch: ${(widthDiff * 100).toFixed(1)}% > ${(tolerance.width * 100).toFixed(1)}%`);
        return false;
      }

      // Check height compatibility
      const heightDiff = Math.abs(filteredDims.height - candidateDims.height) / filteredDims.height;
      if (heightDiff > tolerance.height) {
        this.logger.log(`Height mismatch: ${(heightDiff * 100).toFixed(1)}% > ${(tolerance.height * 100).toFixed(1)}%`);
        return false;
      }

      // Check aspect ratio compatibility
      const filteredAspect = filteredDims.width / filteredDims.height;
      const candidateAspect = candidateDims.width / candidateDims.height;
      const aspectDiff = Math.abs(filteredAspect - candidateAspect) / filteredAspect;
      
      if (aspectDiff > tolerance.aspectRatio) {
        this.logger.log(`Aspect ratio mismatch: ${(aspectDiff * 100).toFixed(1)}% > ${(tolerance.aspectRatio * 100).toFixed(1)}%`);
        return false;
      }

      this.logger.log('Candidate is compatible');
      return true;
    } catch (error) {
      this.logger.error(`Compatibility check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get cached or calculated dimensions of an element
   * @param {Element} element - The element to measure
   * @returns {object|null} Object with width, height, aspectRatio
   */
  getDimensions(element) {
    if (!element) return null;

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(element);
      const cached = this.dimensionCache.get(cacheKey);
      
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        this.logger.log('Using cached dimensions');
        return cached.data;
      }

      // Calculate dimensions
      const rect = element.getBoundingClientRect();
      
      // Handle edge cases
      if (rect.width === 0 || rect.height === 0) {
        this.logger.log('Element has zero dimensions');
        return null;
      }

      const dimensions = {
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.width / rect.height
      };

      // Cache the dimensions
      this.dimensionCache.set(cacheKey, {
        data: dimensions,
        timestamp: Date.now()
      });

      // Cleanup old cache entries
      this.cleanupCache();

      return dimensions;
    } catch (error) {
      this.logger.error(`Failed to get dimensions: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if an element is visible in the viewport
   * @param {Element} element - The element to check
   * @returns {boolean} True if visible
   */
  isVisible(element) {
    if (!element) return false;

    try {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      // Element is visible if it's within viewport or near-viewport (with buffer)
      const buffer = 500; // pixels
      return (
        rect.top < windowHeight + buffer &&
        rect.bottom > -buffer &&
        rect.left < windowWidth + buffer &&
        rect.right > -buffer
      );
    } catch (error) {
      this.logger.error(`Visibility check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get tolerance thresholds for the current site
   * @returns {object} Tolerance object with width, height, aspectRatio
   */
  getTolerance() {
    try {
      const siteSubstitution = this.siteConfig.substitution || {};
      const siteTolerance = siteSubstitution.dimensionTolerance || {};

      return {
        width: siteTolerance.width !== undefined ? siteTolerance.width : this.defaultTolerance.width,
        height: siteTolerance.height !== undefined ? siteTolerance.height : this.defaultTolerance.height,
        aspectRatio: siteTolerance.aspectRatio !== undefined ? siteTolerance.aspectRatio : this.defaultTolerance.aspectRatio
      };
    } catch (error) {
      this.logger.error(`Failed to get tolerance: ${error.message}`);
      return this.defaultTolerance;
    }
  }

  /**
   * Generate a cache key for an element
   * @param {Element} element - The element
   * @returns {string} Cache key
   */
  getCacheKey(element) {
    try {
      // Use element's unique identifier or generate one
      if (element.id) {
        return `dim_${element.id}`;
      }
      
      // Generate key from element's position and class
      const className = element.className || 'no-class';
      const tagName = element.tagName || 'unknown';
      const position = element.getBoundingClientRect().top;
      
      return `dim_${tagName}_${className}_${position}`;
    } catch (error) {
      return `dim_${Math.random()}`;
    }
  }

  /**
   * Check if a cache entry has expired
   * @param {number} timestamp - Cache timestamp
   * @returns {boolean} True if expired
   */
  isCacheExpired(timestamp) {
    return Date.now() - timestamp > this.cacheExpiry;
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    try {
      const now = Date.now();
      const entriesToDelete = [];

      for (const [key, value] of this.dimensionCache.entries()) {
        if (now - value.timestamp > this.cacheExpiry) {
          entriesToDelete.push(key);
        }
      }

      entriesToDelete.forEach(key => this.dimensionCache.delete(key));

      if (entriesToDelete.length > 0) {
        this.logger.log(`Cleaned up ${entriesToDelete.length} cache entries`);
      }
    } catch (error) {
      this.logger.error(`Cache cleanup failed: ${error.message}`);
    }
  }

  /**
   * Clear all cached dimensions
   */
  clearCache() {
    this.dimensionCache.clear();
    this.logger.log('Dimension cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.dimensionCache.size,
      expiry: this.cacheExpiry
    };
  }
}
