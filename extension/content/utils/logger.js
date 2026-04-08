/**
 * Logger utility for the News Filter extension
 * Provides centralized logging with debug mode support
 * Version: 2.3
 */

export class Logger {
  constructor(debug = false) {
    this.debug = debug;
    this.prefix = '[News Filter v2.3]';
  }

  log(message) {
    if (this.debug) {
      console.log(`${this.prefix} ${message}`);
    }
  }

  warn(message) {
    console.warn(`${this.prefix} ${message}`);
  }

  error(message) {
    console.error(`${this.prefix} ${message}`);
  }

  info(message) {
    console.info(`${this.prefix} ${message}`);
  }

  debug_log(message, data = null) {
    if (this.debug) {
      if (data) {
        console.log(`${this.prefix} ${message}`, data);
      } else {
        console.log(`${this.prefix} ${message}`);
      }
    }
  }

  setDebug(debug) {
    this.debug = debug;
  }
}
