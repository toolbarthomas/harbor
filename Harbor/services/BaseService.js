const { join } = require('path');
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

    this.options = this.defineOptions(options);

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
   * The initial handler
   */
  init() {
    this.Console.log(`Launching service: ${this.name}`);
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

  defineOptions(options) {
    return Object.assign(
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
