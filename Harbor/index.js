const Argv = require('./common/Argv');
const Environment = require('./common/Environment');
const Logger = require('./common/Logger');

const Cleaner = require('./services/Cleaner');
const FileSync = require('./services/FileSync');
const JsCompiler = require('./services/JsCompiler');
const JsOptimizer = require('./services/JsOptimizer');
const Resolver = require('./services/Resolver');
const SassCompiler = require('./services/SassCompiler');
const Server = require('./services/Server');
const StyleguideCompiler = require('./services/StyleguideCompiler');
const StyleOptimizer = require('./services/StyleOptimizer');
const SvgSpriteCompiler = require('./services/SvgSpriteCompiler');

const TaskManager = require('./tooling/TaskManager');
const Watcher = require('./tooling/Watcher');

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();

    const environment = new Environment();
    this.env = environment.define();

    this.Console = new Logger(this.env);

    this.tooling = {
      TaskManager: new TaskManager(),
    };

    this.services = {
      Cleaner: new Cleaner(this.tooling),
      FileSync: new FileSync(this.tooling),
      JsCompiler: new JsCompiler(this.tooling),
      JsOptimizer: new JsOptimizer(this.tooling, {
        acceptedEnvironments: 'production',
      }),
      Resolver: new Resolver(this.tooling),
      SassCompiler: new SassCompiler(this.tooling),
      Server: new Server(this.tooling, {
        acceptedEnvironments: 'development',
      }),
      StyleguideCompiler: new StyleguideCompiler(this.tooling),
      StyleOptimizer: new StyleOptimizer(this.tooling, {
        acceptedEnvironments: 'production',
      }),
      SvgSpriteCompiler: new SvgSpriteCompiler(this.tooling),
    };
  }

  /**
   * Init Harbor and run tasks specified from the Command Line Arguments.
   */
  async init() {
    const { task, watch } = this.Argv.args;

    if (watch) {
      const Watch = new Watcher(this.tooling.TaskManager);

      Watch.spawn(task);
    }

    const result = await this.tooling.TaskManager.publish(task);

    if (result) {
      if (result.exceptions && result.exceptions.length) {
        if (this.env.THEME_ENVIRONMENT === 'production') {
          throw Error(
            `Not all tasks have been completed correctly: ${result.exceptions.join(', ')}`
          );
        }
      }

      if (result.completed && result.completed.length) {
        if (result.exceptions && !result.exceptions.length) {
          this.Console.success(`Successfully completed ${result.completed.length} tasks`);
        }
      } else if (result.exceptions && result.exceptions.length) {
        this.Console.warning(
          `The following tasks did not complete correctly: ${result.exceptions.join(', ')}`
        );
      }
    }
  }

  /**
   * Returns the Harbor environment configuration.
   *
   * @returns the defined Harbor environment configuration.
   */
  getEnvironment() {
    return this.env ? this.env : this.Environment.define();
  }

  styleguideSetup() {
    return this.services.StyleguideCompiler.setup(this.getEnvironment());
  }
}

module.exports = Harbor;
