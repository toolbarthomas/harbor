const { join } = require('path');
const { sync } = require('glob');

const ConfigManager = require('../common/ConfigManager');

const Environment = require('../common/Environment');
const Logger = require('../common/Logger');

/**
 * Base class for creating new Services that should be used within tasks.
 */
class BaseService {
  constructor(tooling) {
    const environment = new Environment();

    this.name = this.constructor.name;

    this.environment = environment.define();
    this.Console = new Logger(this.environment);

    this.config = ConfigManager.load(this.name);
    this.tooling = {};

    const hook =
      this.config.hook && this.config.hook !== this.name
        ? [this.name, this.config.hook]
        : [this.name];

    if (tooling) {
      this.Console.log(
        `Assining tools: ${Object.keys(tooling).join(', ')} => ${this.name} as ${hook.join(', ')}`
      );
      this.tooling = Object.assign(this.tooling, tooling);
    }

    const { TaskManager } = this.tooling;

    if (TaskManager) {
      TaskManager.subscribe(this.name, hook, this.init.bind(this));
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
  resolve() {
    const { TaskManager } = this.tooling;

    if (TaskManager && TaskManager.resolve) {
      this.Console.log(`Resolving service: ${this.name}`);

      TaskManager.resolve(this.name);
    } else {
      this.Console.warning(`Unable to resolve ${this.name}, unable to find the Task Manager.`);
    }
  }
}

module.exports = BaseService;
