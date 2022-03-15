import Core from '../common/Core.js';

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
   * Returns the defined configuration option with optional fallback.
   *
   * @param {String} name The configurated option to return.
   * @param {*} defaultValue Returns the fallback value instead.
   */
  getOption(name, defaultValue) {
    if (this.config.options && this.config.options[name] != null) {
      return this.config.options[name];
    }

    return defaultValue;
  }
}

export default Worker;
