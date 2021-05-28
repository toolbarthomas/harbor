import Core from '../common/Core.js';

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
export default class Plugin extends Core {
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
   * Creates a collection of destination paths from the configured service entry
   * configuration.
   *
   * @param {boolean} useDestination Defines the paths from the THEME_DIST
   * environment variable.
   */
  defineEntry() {
    super.defineEntry(true);
  }
}
