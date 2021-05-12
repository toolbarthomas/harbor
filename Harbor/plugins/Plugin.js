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
  constructor(services, options, workers) {
    super(services, options, 'plugins', workers);

    if (workers && workers instanceof Object) {
      Object.keys(workers).forEach((worker) =>
        this.Console.log(`Assigning worker: ${worker} for ${this.name}`)
      );

      this.workers = workers;
    }
  }

  /**
   * The initial handler that will subscribed to the Harbor TaskManager.
   */
  init() {
    this.defineEntry(true);
  }
}

module.exports = Plugin;
