const chalk = require('chalk');
const symbols = require('log-symbols');

class Logger {
  constructor(name, environment) {
    this.name = name;
    this.environment = environment;
  }

  /**
   * Prints out an error message & exit the current process.
   *
   * @param {String|Array} message The message to display.
   * @param {Boolean} keepAlive Onlu exit running Node process but
   * don't kill the process.
   */
  error(message, keepAlive) {
    this.outputMessages(message, 'error', '');

    if (!keepAlive) {
      process.exit(1);
    }
  }

  /**
   * Prints out a warning message.
   *
   * @param {String|Array} message The message to display.
   */
  warning(message) {
    this.outputMessages(message, 'warn', 'warning');
  }

  /**
   * Prints out an success message.
   *
   * @param {String|Array} message The message to display.
   */
  success(message) {
    this.outputMessages(message, 'log', 'success');
  }

  /**
   * Prints out an info message.
   *
   * @param {String|Array} message The message to display.
   */
  info(message) {
    this.outputMessages(message, 'info', 'info');
  }

  /**
   * Prints out a log message.
   *
   * @param {String|Array} message The message to display.
   */
  log(message) {
    if (this.environment && !this.environment.THEME_DEVMODE) {
      return;
    }

    this.outputMessages(message, 'log');
  }

  /**
   * Check if the defined message has been split up in multiple lines.
   * Ouput a new console method for each message entry.
   *
   * @param {String|Array} message The actual message to output
   * @param {String} method Defines the method to use for the console Object.
   */
  outputMessages(message, method, type) {
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

  /**
   * Updates the environment object configuration for the current Logger
   * instance.
   *
   * @param {Object} environment Updates the environment from the given object.
   *
   * @returns {void}
   */
  setEnvironment(environment) {
    if (environment) {
      return;
    }

    this.environment = environment;
  }
}

module.exports = Logger;
