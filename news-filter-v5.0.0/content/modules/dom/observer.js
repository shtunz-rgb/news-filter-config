/**
 * Optimized MutationObserver for the News Filter extension
 * Processes only newly added nodes instead of re-scanning entire page
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

export class OptimizedObserver {
  constructor(filterEngine, options = {}) {
    this.filterEngine = filterEngine;
    this.logger = new Logger(options.debug);
    this.debounceDelay = options.debounceDelay || DEFAULT_CONFIG.DEBOUNCE_DELAY;
    this.scanTimeout = null;
    this.observer = null;
    this.mutationCount = 0;
    this.lastScanTime = Date.now();
  }

  /**
   * Set up the MutationObserver
   */
  setup() {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.logger.log('MutationObserver set up');
  }

  /**
   * Handle mutations from the observer
   * V2.5 OPTIMIZATION: Process only newly added nodes
   * @param {array} mutations - Array of MutationRecord objects
   */
  handleMutations(mutations) {
    this.mutationCount += mutations.length;

    // Collect only new nodes
    const nodesToProcess = [];

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            nodesToProcess.push(node);
          }
        });
      }
    });

    if (nodesToProcess.length === 0) {
      this.logger.log(`No element nodes added in ${mutations.length} mutations`);
      return;
    }

    this.logger.log(`Processing ${nodesToProcess.length} new nodes from ${mutations.length} mutations`);

    // Debounce the processing
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }

    this.scanTimeout = setTimeout(() => {
      const startTime = Date.now();
      this.filterEngine.scanAddedNodes(nodesToProcess);
      const endTime = Date.now();
      
      this.lastScanTime = endTime;
      this.logger.log(`Scan completed in ${endTime - startTime}ms`);
    }, this.debounceDelay);
  }

  /**
   * Disconnect the observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.logger.log('MutationObserver disconnected');
    }
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
  }

  /**
   * Reconnect the observer
   */
  reconnect() {
    if (this.observer) {
      this.disconnect();
    }
    this.setup();
  }

  /**
   * Get observer statistics
   * @returns {object} Statistics object
   */
  getStatistics() {
    return {
      mutationCount: this.mutationCount,
      lastScanTime: this.lastScanTime,
      debounceDelay: this.debounceDelay
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.mutationCount = 0;
    this.lastScanTime = Date.now();
  }
}
