const { join } = require('path');
const { statSync } = require('fs');
const { sync } = require('glob');

const Core = require('../common/Core');

/**
 * Creates a new Harbor Service that will be registered to the TaskManager.
 * The defined Service configuration & plugin specific options will be loaded
 * during the construction of the instance.
 *
 * @param {Object} services Includes optional Harbor utilities for the current
 * service.
 *
 * @param {Object} options Defines the Harbor specific options for the current
 * service.
 */
class Worker extends Core {
  constructor(services, options) {
    super(services, options, 'workers');
  }

  /**
   * The initial handler that will subscribed to the Harbor TaskManager.
   */
  init() {
    this.defineEntry();
  }

  /**
   * Creates a collection of entry paths from the configured service entry
   * configuration.
   *
   * @param {boolean} useDestination Use the defined THEME_DIST as base path for
   * the current entry, instead of the default THEME_SRC value.
   */
  defineEntry(useDestination) {
    if (!this.config.entry || !this.config.entry instanceof Object) {
      return;
    }

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return;
    }

    this.entry = entries
      .map((name) => {
        const p = join(
          useDestination ? this.environment.THEME_DIST : this.environment.THEME_SRC,
          this.config.entry[name]
        );

        return sync(p).filter((e) => {
          if (!statSync(e).size) {
            this.Console.log(`Skipping empty entry: ${e}`);
          }

          return statSync(e).size > 0 ? e : null;
        });
      })
      .filter((entry) => entry.length);
  }
}

module.exports = Worker;
