import path from 'path';
import fs from 'fs';
import glob from 'glob';

import { Logger } from './Logger.js';

/**
 * Base Framework for defining Workers & Plugins.
 *
 * @param {object} services Harbor services for the current Harbor instance.
 * @param {object} options Defines the specific Harbor instance configuration that
 * should not be customized.
 * @param {string} type Defines the new instance as Worker or Plugin.
 * @param {string} typeName The name that will be used within the CLI.
 */
export class Core {
  constructor(services, options, type, typeName) {
    this.name = this.constructor.name;

    this.Console = new Logger();

    this.type = type;
    this.typeName = typeName || this.type;

    if (services) {
      this.Console.log(`Mounting services for ${this.name}: ${Object.keys(services).join(', ')}`);

      this.services = Object.assign(this.services || {}, services || {});
    }

    this.defineOptions(options);
  }

  /**
   * Returns the defined configuration option with optional fallback.
   *
   * @param {String} name The configurated option to return.
   * @param {*} defaultValue Returns the fallback value instead.
   */
  getOption(name, defaultValue) {
    if (!name && this.config.options) {
      return this.getOptions();
    }

    if (this.config.options && this.config.options[name] != null) {
      return this.config.options[name];
    }

    return defaultValue;
  }

  /**
   * Helper function to return the defined option for the Harbor Service.
   */
  getOptions() {
    return this.config.options;
  }

  /**
   * Parse the requested Environment variable to the correct Primitive.
   *
   * @param {String} name Transforms the defined Environment variable if it
   * exists.
   */
  parseEnvironmentProperty(name) {
    const prop = this.environment[name];

    if (!prop) {
      this.Console.warning(`Unable to use Environment value since '${name}' is not defined...`);
    }

    //
    if (!Number.isNaN(parseFloat(prop))) {
      return Number(prop);
    }

    // Ensures the given property is transformed as Boolean.
    if (typeof prop === 'string') {
      if (prop.toLowerCase() === 'false') {
        return false;
      }

      if (prop.toLowerCase() === 'true') {
        return true;
      }
    }

    return prop;
  }

  /**
   * Defines the specific Harbor instance options.
   *
   * @param {Object} options The options that will be defined for the running
   * instance.
   */
  defineOptions(options) {
    this.options = {
      acceptedEnvironments: [],
      ...Object.assign(options || {}, {
        acceptedEnvironments: Core.defineAcceptedEnvironments(options),
      }),
    };

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
  static defineAcceptedEnvironments(options) {
    if (!options) {
      return [];
    }

    if (!options.acceptedEnvironments) {
      return [];
    }

    return Array.isArray(options.acceptedEnvironments)
      ? options.acceptedEnvironments
      : [options.acceptedEnvironments];
  }

  /**
   * Assigns the environment Object to the current Service or Plugin.
   * @param {Object} environment The parsed environment configuration to use.
   */
  defineEnvironment(environment) {
    if (environment instanceof Object) {
      this.environment = environment;
    }
  }

  /**
   * Creates a collection of destination paths from the configured service entry
   * configuration.
   *
   * @param {boolean} useDestination Defines the paths from the THEME_DIST
   * environment variable.
   */
  defineEntry(useDestination) {
    if (!this.config.entry || !(this.config.entry instanceof Object)) {
      this.Console.log(`Unable to start ${this.name}, no entry file has been configured...`);
      return;
    }

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      this.Console.log(`Skipping ${this.name}, unable to find any entry files...`);
      return;
    }

    this.entry = entries
      .map((name) => {
        // Ensure the sources for the current entry are flattened.
        const map = [];
        const sources = Array.isArray(this.config.entry[name])
          ? this.config.entry[name]
          : [this.config.entry[name]];

        if (!sources.length) {
          return [];
        }

        sources.forEach((source) => {
          const p = path.join(
            useDestination ? this.environment.THEME_DIST : this.environment.THEME_SRC,
            source
          );

          map.push(
            ...glob.sync(p).filter((e) => {
              if (!fs.statSync(e).size) {
                this.Console.log(`Skipping empty entry: ${e}`);
              }

              return fs.statSync(e).size > 0 ? e : null;
            })
          );
        });

        return map.length ? map : [];
      })
      .filter((entry) => entry.length);
  }

  /**
   * Ensures the given line is encoded correctly for Command line interfaces.
   *
   * @param {String} line The line that will be escaped.
   */
  static escapeCommand(line) {
    return line.replace(/ /g, '\\ ');
  }

  /**
   * Helper function to flatten a nested array.
   *
   * @param {Array} arr The array that will be flatten.
   */
  flatten(arr) {
    return arr.reduce(
      (acc, current) => acc.concat(Array.isArray(current) ? this.flatten(current) : current),
      []
    );
  }

  /**
   * Subscribes the init handler of the current Worker or Plugin to the
   * TaskManager.
   *
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
      this.typeName,
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
   *
   * @param {boolean} exit Exits the running Harbor process.
   */
  resolve(exit) {
    const { TaskManager } = this.services;

    if (!TaskManager || !TaskManager.resolve) {
      return this.Console.warning(
        `Unable to resolve ${this.name}, TaskManager has not been defined.`
      );
    }
    this.Console.log(`${exit ? 'Rejecting' : 'Resolving'} ${this.typeName}: ${this.name}`);

    return TaskManager.resolve(this.type, this.name, exit);
  }

  /**
   * Rejects the subscribed Task Manager Service handler.
   */
  reject() {
    this.resolve(true);
  }

  /**
   * Defines the existing console class within the current service.
   *
   * @param {Logger} Console The existing Logger instance that will be assigned
   * to the Class instance.
   */
  defineConsole(Console) {
    if (!Console) {
      return;
    }

    if (this.Console) {
      Console.log(`Updating Console instance for ${this.name}...`);
    }

    this.Console = Console;

    this.Console.log(`Initial console assigned to ${this.name}`);
  }
}
