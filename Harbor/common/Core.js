const { join } = require('path');
const { statSync } = require('fs');
const { sync } = require('glob');

const ConfigManager = require('../common/ConfigManager');
const Environment = require('./Environment');
const Logger = require('../common/Logger');

/**
 * Base Framework for defining Workers & Plugins.
 *
 * @param {object} services Harbor services for the current Harbor instance.
 * @param {object} options Defines the specific Harbor instance configuration that
 * should not be customized.
 * @param {string} type Defines the new instance as Worker or Plugin.
 */
class Core {
  constructor(services, options, type) {
    this.name = this.constructor.name;

    this.environment = this.defineEnvironment();
    this.Console = new Logger(this.environment);

    this.config = ConfigManager.load(this.name, type);
    this.type = type;
    this.services = Object.assign(this.services || {}, services || {});

    // Defines the initiation hook that will be used by the TaskManager Service.
    const h = this.config.hook
      ? Array.isArray(this.config.hook)
        ? this.config.hook
        : [String(this.config.hook)]
      : [this.name];

    const hook = [this.name, ...h.filter((hh) => hh !== this.name)];

    if (services) {
      this.Console.log(`Mounting services for ${this.name}: ${Object.keys(services).join(', ')}`);

      this.services = Object.assign(this.services, services);
    }

    this.defineOptions(options);

    // Exposes the current instance within the TaskManager Service.
    this.subscribe(type, hook);
  }

  /**
   * Defines the specific Harbor instance options.
   *
   * @param {Object} options The options that will be defined for the running
   * instance.
   */
  defineOptions(options) {
    this.options = Object.assign(
      {
        acceptedEnvironments: [],
      },
      Object.assign(options || {}, {
        acceptedEnvironments: this.defineAcceptedEnvironments(options),
      })
    );

    if (options) {
      this.Console.log(`${this.type} options defined for ${this.name}`);
    }
  }

  /**
   * Defines the accepted environment option that blocks the service if the
   * running environment is included within the defined option.
   *
   * @param {Object} options Defines the value from the given options.
   */
  defineAcceptedEnvironments(options) {
    if (!options) {
      return;
    }

    if (!options.acceptedEnvironments) {
      return;
    }

    return Array.isArray(options.acceptedEnvironments)
      ? options.acceptedEnvironments
      : [options.acceptedEnvironments];
  }

  defineEnvironment() {
    const Env = new Environment();

    return this.environment instanceof Object ? this.environment : Env.define();
  }

  /**
   * Creates a collection of destination paths from the configured service entry
   * configuration.
   *
   * @param {boolean} useDestination Defines the paths from the THEME_DIST
   * environment variable.
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

  /**
   * Subscribes the init handler of the current Worker or Plugin to the
   * TaskManager.
   *
   * @param {string} type Defines the Task as Plugin or Worker.
   * @param {string[]} hook Defines the publish hooks to call to subscription.
   */
  subscribe(type, hook) {
    const { TaskManager } = this.services;

    if (!TaskManager) {
      this.Console.warning(`Unable to subscribe ${this.name}, TaskManager has not been defined.`);
      return;
    }

    if (!hook) {
      this.Console.warning(`Unable to subscribe, no hook has been defined for ${this.name}`);
      return;
    }

    TaskManager.subscribe(
      type,
      this.name,
      hook,
      TaskManager.initIfAccepted(this.options)
        ? this.init.bind(this)
        : () => {
            this.Console.warning(
              `${
                this.name
              } will not be launched since it is only accepted for the ${this.options.acceptedEnvironments.join(
                ', '
              )} environments.`
            );

            return this.resolve();
          }
    );
  }

  /**
   * Resolves the subscribed Task Manager Service handler.
   */
  resolve(exit) {
    const { TaskManager } = this.services;

    if (!TaskManager || !TaskManager.resolve) {
      return this.Console.warning(
        `Unable to resolve ${this.name}, TaskManager has not been defined.`
      );
    }
    this.Console.log(`Resolving ${this.type}: ${this.name}`);

    TaskManager.resolve(this.type, this.name, exit);
  }

  /**
   * Rejects the subscribed Task Manager Service handler.
   */
  reject() {
    this.resolve(true);
  }
}

module.exports = Core;