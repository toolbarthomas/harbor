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
export default class Worker extends Core {
  constructor(services, options) {
    super(services, options, 'workers');
  }
}
