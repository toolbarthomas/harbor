const Core = require('../common/Core');

/**
 * Creates a new Harbor Worker that will be registered to the TaskManager.
 * The defined Worker configuration & specific options will be used
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
}

module.exports = Worker;
