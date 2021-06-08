import path from 'path';
import fs from 'fs';
import glob from 'glob';

import ConfigManager from '../common/ConfigManager.js';
import Environment from './Environment.js';
import Logger from '../common/Logger.js';

/**
 * Base Framework for defining Workers & Plugins.
 *
 * @param {object} services Harbor services for the current Harbor instance.
 * @param {object} options Defines the specific Harbor instance configuration that
 * should not be customized.
 * @param {string} type Defines the new instance as Worker or Plugin.
 */
export default class Core {
  constructor(services, options, type) {
    this.name = this.constructor.name;

    this.environment = this.defineEnvironment();
    this.Console = new Logger(this.environment);
    this.type = type;

    this.services = Object.assign(this.services || {}, services || {});

    if (services) {
      this.Console.log(`Mounting services for ${this.name}: ${Object.keys(services).join(', ')}`);

      this.services = Object.assign(this.services, services);
    }

    this.defineOptions(options);
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
   * Subscribes the defined configuration object to the current instance.
   *
   * @param {Object} config The Harbor configuration object that will be defined.
   */
  defineConfig(config) {
    this.config = config;
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
        const p = path.join(
          useDestination ? this.environment.THEME_DIST : this.environment.THEME_SRC,
          this.config.entry[name]
        );

        return glob.sync(p).filter((e) => {
          if (!fs.statSync(e).size) {
            this.Console.log(`Skipping empty entry: ${e}`);
          }

          return fs.statSync(e).size > 0 ? e : null;
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
  subscribe(hook) {
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
      this.type,
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
              )} environment(s).`
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
