/**
 * Storage manager for the News Filter extension
 * Handles Chrome storage API interactions
 * Version: 2.3
 */

import { Logger } from '../../utils/logger.js';
import { STORAGE_KEYS } from '../config/defaults.js';

export class StorageManager {
  constructor(options = {}) {
    this.logger = new Logger(options.debug);
    this.storageQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Load keywords from storage
   * @returns {Promise<array>} Array of keywords
   */
  async loadKeywords() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.KEYWORDS], (result) => {
        const keywords = result[STORAGE_KEYS.KEYWORDS] || [];
        this.logger.log(`Loaded ${keywords.length} keywords from storage`);
        resolve(keywords);
      });
    });
  }

  /**
   * Save keywords to storage
   * @param {array} keywords - Array of keywords to save
   * @returns {Promise<void>}
   */
  async saveKeywords(keywords) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEYS.KEYWORDS]: keywords }, () => {
        this.logger.log(`Saved ${keywords.length} keywords to storage`);
        resolve();
      });
    });
  }

  /**
   * Load enabled state from storage
   * @returns {Promise<boolean>} Whether filtering is enabled
   */
  async loadEnabledState() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEYS.IS_ENABLED], (result) => {
        const isEnabled = result[STORAGE_KEYS.IS_ENABLED] !== undefined 
          ? result[STORAGE_KEYS.IS_ENABLED] 
          : true;
        this.logger.log(`Loaded enabled state: ${isEnabled}`);
        resolve(isEnabled);
      });
    });
  }

  /**
   * Save enabled state to storage
   * @param {boolean} isEnabled - Whether filtering is enabled
   * @returns {Promise<void>}
   */
  async saveEnabledState(isEnabled) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEYS.IS_ENABLED]: isEnabled }, () => {
        this.logger.log(`Saved enabled state: ${isEnabled}`);
        resolve();
      });
    });
  }

  /**
   * Load filtered articles from local storage
   * @returns {Promise<array>} Array of filtered articles
   */
  async loadFilteredArticles() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.FILTERED_ARTICLES], (result) => {
        const articles = result[STORAGE_KEYS.FILTERED_ARTICLES] || [];
        this.logger.log(`Loaded ${articles.length} filtered articles from storage`);
        resolve(articles);
      });
    });
  }

  /**
   * Save filtered articles to local storage
   * @param {array} articles - Array of articles to save
   * @returns {Promise<void>}
   */
  async saveFilteredArticles(articles) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.FILTERED_ARTICLES]: articles }, () => {
        this.logger.log(`Saved ${articles.length} filtered articles to storage`);
        resolve();
      });
    });
  }

  /**
   * Add an article to the filtered articles queue
   * @param {object} article - Article object with title, keyword, url, etc.
   */
  queueArticle(article) {
    this.storageQueue.push(article);
    this.logger.log(`Queued article: "${article.title}" (queue length: ${this.storageQueue.length})`);
    this.processQueue();
  }

  /**
   * Process the storage queue sequentially
   * This prevents race conditions with Chrome storage API
   */
  async processQueue() {
    if (this.isProcessingQueue || this.storageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const article = this.storageQueue.shift();

    try {
      const articles = await this.loadFilteredArticles();
      
      // Check if article already exists
      const exists = articles.some(a => a.url === article.url);
      if (!exists) {
        articles.push(article);
        await this.saveFilteredArticles(articles);
        this.logger.log(`Saved article to storage: "${article.title}"`);
      } else {
        this.logger.log(`Article already in storage, skipping: "${article.title}"`);
      }
    } catch (error) {
      this.logger.error(`Error processing queue: ${error.message}`);
    }

    this.isProcessingQueue = false;

    // Process next item if queue is not empty
    if (this.storageQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Clear the storage queue
   */
  clearQueue() {
    this.storageQueue = [];
    this.logger.log('Cleared storage queue');
  }

  /**
   * Get queue statistics
   * @returns {object} Queue statistics
   */
  getQueueStats() {
    return {
      queueLength: this.storageQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }

  /**
   * Clear all filtered articles from storage
   * @returns {Promise<void>}
   */
  async clearFilteredArticles() {
    return new Promise((resolve) => {
      chrome.storage.local.remove([STORAGE_KEYS.FILTERED_ARTICLES], () => {
        this.logger.log('Cleared all filtered articles from storage');
        resolve();
      });
    });
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<object>} Storage statistics
   */
  async getStorageStats() {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        resolve({
          bytesInUse: bytesInUse,
          bytesAvailable: chrome.storage.local.QUOTA_BYTES || 10485760 // 10MB default
        });
      });
    });
  }
}
