const Core = require('../common/Core');

/**
 * Creates a new Harbor Plugin that will be registered to the TaskManager.
 * The defined Plugin configuration & specific options will be used
 * during the construction of the instance.
 *
 * @param {Object} services Includes optional Harbor utilities for the current
 * service.
 *
 * @param {Object} options Defines the Harbor specific options for the current
 * service.
 */
class Plugin extends Core {
  constructor(services, options) {
    super(services, options, 'plugins');
  }

  /**
   * The initial handler that will subscribed to the Harbor TaskManager.
   */
  init() {
    this.defineEntry(true);
  }
}

module.exports = Plugin;
