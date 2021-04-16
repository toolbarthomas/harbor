const { join, resolve } = require('path');
const { statSync } = require('fs');
const { sync } = require('glob');

const ConfigManager = require('../common/ConfigManager');

const Environment = require('../common/Environment');
const Logger = require('../common/Logger');

/**
 * Base class for creating new Services that should be used within tasks.
 */
class BaseService {
  constructor(tooling, options) {
    const environment = new Environment();

    this.name = this.constructor.name;

    this.environment = environment.define();
    this.Console = new Logger(this.environment);

    this.config = ConfigManager.load(this.name);
    this.tooling = {};

    this.defineOptions(options);

    const hook =
      this.config.hook && this.config.hook !== this.name
        ? [this.name, this.config.hook]
        : [this.name];

    if (tooling) {
      this.Console.log(
        `Assigning tools: ${Object.keys(tooling).join(', ')} => ${this.name} as ${hook.join(', ')}`
      );
      this.tooling = Object.assign(this.tooling, tooling);
    }

    this.subscribe(hook);
  }

  /**
   * The initial handler
   */
  init() {
    this.Console.log(`Launching service: ${this.name}`);

    this.defineEntry();
  }

  /**
   * Resolves the subscribed Task Manager Service handler.
   */
  resolve(exit) {
    const { TaskManager } = this.tooling;

    if (TaskManager && TaskManager.resolve) {
      this.Console.log(`Resolving service: ${this.name}`);

      TaskManager.resolve(this.name, exit);
    } else {
      this.Console.warning(`Unable to resolve ${this.name}, unable to find the Task Manager.`);
    }
  }

  /**
   * Rejects the subscribed Task Manager Service handler.
   */
  reject() {
    this.resolve(true);
  }

  /**
   * Subscribes the init handler of the current Service to the Task Manager.
   *
   * @param {string[]} hook Defines the publish hooks to call to subscription.
   */
  subscribe(hook) {
    const { TaskManager } = this.tooling;

    if (TaskManager) {
      TaskManager.subscribe(
        this.name,
        hook,
        this.initIfAccepted()
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
  }

  /**
   *
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

        return sync(p).filter((e) => statSync(e).size > 0);
      })
      .filter((entry) => entry.length);
  }

  defineOptions(options) {
    this.options = Object.assign(
      {
        acceptedEnvironments: [],
      },
      Object.assign(options || {}, {
        acceptedEnvironments: this.defineAcceptedEnvironments(options),
      })
    );
  }

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

  initIfAccepted() {
    if (!this.options) {
      return true;
    }

    if (!this.options.acceptedEnvironments || !this.options.acceptedEnvironments.length) {
      return true;
    }

    if (this.options.acceptedEnvironments.includes(this.environment.THEME_ENVIRONMENT)) {
      return true;
    }

    return false;
  }

  isRestricted() {
    if (!this.options) {
      return;
    }

    if (!this.options.restricted || !this.options.restricted.length) {
      return;
    }

    if (this.options.restricted.includes(this.environment.THEME_ENVIRONMENT)) {
      return true;
    }

    return;
  }
}

module.exports = BaseService;
