import chalk from 'chalk';
import symbols from 'log-symbols';

import Argv from './Argv.js';

/**
 * Helper Class that writes messages to the stdout.
 */
class Logger {
  constructor(environment) {
    this.environment = environment;

    const { args } = new Argv();

    this.verbose = args.verbose;
  }

  /**
   * Prints out an error message & exit the current process.
   *
   * @param {String|Array} message The message to display.
   * @param {Boolean} keepAlive Prevents an exit on the current process.
   */
  error(message) {
    Logger.outputMessages(message, 'error', 'error');
  }

  /**
   * Prints out a warning message.
   *
   * @param {String|Array} message The message to display.
   */
  warning(message) {
    Logger.outputMessages(message, 'warn', 'warning');
  }

  /**
   * Prints out an success message.
   *
   * @param {String|Array} message The message to display.
   */
  success(message) {
    Logger.outputMessages(message, 'log', 'success');
  }

  /**
   * Prints out an info message.
   *
   * @param {String|Array} message The message to display.
   */
  info(message) {
    Logger.outputMessages(message, 'info', 'info');
  }

  /**
   * Prints out a log message that will only be visible if THEME_DEBUG is TRUE
   * within the current environment.
   *
   * @param {String|Array} message The message to display.
   */
  log(message) {
    if (!this.verbose) {
      return;
    }

    Logger.outputMessages(message, 'log');
  }

  /**
   * Check if the defined message has been split up in multiple lines.
   * Ouput a new console method for each message entry.
   *
   * @param {String|Array} message The actual message to output
   * @param {String} method Defines the method to use for the console Object.
   */
  static outputMessages(message, method, type) {
    const styles = Logger.getMessageStyle(type);

    if (message.constructor === Array && message instanceof Array) {
      message.forEach((m) => {
        // eslint-disable-next-line no-console
        console[method](chalk[styles.color](symbols[styles.symbol] && symbols[styles.symbol], m));
      });
    } else {
      // eslint-disable-next-line no-console
      console[method](
        chalk[styles.color](symbols[styles.symbol] && symbols[styles.symbol], message)
      );
    }
  }

  /**
   * Helper function for returning the correct styles from the defined method.
   *
   * @param {String} method The method to compare.
   *
   * @return {Object} The styles object to return.
   */
  static getMessageStyle(type) {
    const styles = {};

    switch (type) {
      case 'error':
        styles.color = 'red';
        styles.symbol = 'error';
        break;
      case 'warning':
        styles.color = 'yellow';
        styles.symbol = 'warning';
        break;
      case 'success':
        styles.color = 'green';
        styles.symbol = 'success';
        break;
      case 'info':
        styles.color = 'blue';
        styles.symbol = 'info';
        break;
      default:
        styles.color = 'grey';
        break;
    }

    return styles;
  }
}

export default Logger;
