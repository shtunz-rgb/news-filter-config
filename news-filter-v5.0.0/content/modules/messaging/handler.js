/**
 * Messaging handler for the News Filter extension
 * Handles communication between content script and popup/background
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';
import { MESSAGE_ACTIONS } from '../config/defaults.js';

export class MessagingHandler {
  constructor(filterEngine, options = {}) {
    this.filterEngine = filterEngine;
    this.logger = new Logger(options.debug);
  }

  /**
   * Set up message listeners
   */
  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    this.logger.log('Message listeners set up');
  }

  /**
   * Handle incoming messages
   * @param {object} message - The message object
   * @param {object} sender - The sender information
   * @param {function} sendResponse - Function to send response
   */
  handleMessage(message, sender, sendResponse) {
    this.logger.log(`Received message: ${message.action}`);

    switch (message.action) {
      case MESSAGE_ACTIONS.UPDATE_KEYWORDS:
        this.handleUpdateKeywords(message, sendResponse);
        break;

      case MESSAGE_ACTIONS.TOGGLE_ENABLED:
        this.handleToggleEnabled(message, sendResponse);
        break;

      case MESSAGE_ACTIONS.GET_STATUS:
        this.handleGetStatus(message, sendResponse);
        break;

      case MESSAGE_ACTIONS.UPDATE_FILTER_COUNT:
        this.handleUpdateFilterCount(message, sendResponse);
        break;

      case MESSAGE_ACTIONS.TRACK_ARTICLE:
        this.handleTrackArticle(message, sendResponse);
        break;

      case MESSAGE_ACTIONS.GET_FILTERED_ARTICLES:
        this.handleGetFilteredArticles(message, sendResponse);
        break;

      default:
        this.logger.warn(`Unknown message action: ${message.action}`);
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  /**
   * Handle keyword update message
   * @param {object} message - The message
   * @param {function} sendResponse - Response callback
   */
  handleUpdateKeywords(message, sendResponse) {
    try {
      const keywords = message.keywords || [];
      this.filterEngine.setKeywords(keywords);
      this.filterEngine.scanAndFilter();
      
      this.logger.log(`Keywords updated: ${keywords.join(', ')}`);
      sendResponse({ success: true, count: keywords.length });
    } catch (error) {
      this.logger.error(`Error updating keywords: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle toggle enabled message
   * @param {object} message - The message
   * @param {function} sendResponse - Response callback
   */
  handleToggleEnabled(message, sendResponse) {
    try {
      const isEnabled = message.isEnabled !== false;
      this.filterEngine.setEnabled(isEnabled);

      if (isEnabled) {
        this.filterEngine.scanAndFilter();
      } else {
        this.filterEngine.clearAllOverlays();
      }

      this.logger.log(`Filtering ${isEnabled ? 'enabled' : 'disabled'}`);
      sendResponse({ success: true, isEnabled });
    } catch (error) {
      this.logger.error(`Error toggling enabled: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle get status message
   * @param {object} message - The message
   * @param {function} sendResponse - Response callback
   */
  handleGetStatus(message, sendResponse) {
    try {
      const status = {
        isEnabled: this.filterEngine.isEnabled,
        keywordsCount: this.filterEngine.keywords.length,
        filteredCount: this.filterEngine.filteredCount,
        domain: this.filterEngine.selectorEngine.getDomain()
      };

      this.logger.log(`Status requested: ${JSON.stringify(status)}`);
      sendResponse({ success: true, ...status });
    } catch (error) {
      this.logger.error(`Error getting status: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle update filter count message
   * @param {object} message - The message
   * @param {function} sendResponse - Response callback
   */
  handleUpdateFilterCount(message, sendResponse) {
    try {
      const count = message.count || 0;
      this.logger.log(`Filter count update: ${count}`);
      sendResponse({ success: true });
    } catch (error) {
      this.logger.error(`Error updating filter count: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle track article message
   * @param {object} message - The message
   * @param {function} sendResponse - Response callback
   */
  handleTrackArticle(message, sendResponse) {
    try {
      const article = message.article;
      this.filterEngine.storageManager.queueArticle(article);
      
      this.logger.log(`Article tracked: "${article.title}"`);
      sendResponse({ success: true });
    } catch (error) {
      this.logger.error(`Error tracking article: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle get filtered articles message
   * @param {object} message - The message
   * @param {function} sendResponse - Response callback
   */
  async handleGetFilteredArticles(message, sendResponse) {
    try {
      const articles = await this.filterEngine.storageManager.loadFilteredArticles();
      
      this.logger.log(`Retrieved ${articles.length} filtered articles`);
      sendResponse({ success: true, articles });
    } catch (error) {
      this.logger.error(`Error getting filtered articles: ${error.message}`);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Send a message to the background script
   * @param {object} message - The message to send
   * @returns {Promise} Promise that resolves with the response
   */
  sendToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          this.logger.error(`Error sending message: ${chrome.runtime.lastError.message}`);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Send a message to the popup
   * @param {object} message - The message to send
   * @returns {Promise} Promise that resolves with the response
   */
  sendToPopup(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message).catch(() => {
        // Popup not open, ignore error
        resolve(null);
      });
    });
  }
}
