const Argv = require('./common/Argv');
const Environment = require('./common/Environment');
const Logger = require('./common/Logger');

const TaskManager = require('./services/TaskManager');

const Cleaner = require('./workers/Cleaner');
const FileSync = require('./workers/FileSync');
const JsCompiler = require('./workers/JsCompiler');
const Resolver = require('./workers/Resolver');
const SassCompiler = require('./workers/SassCompiler');
const SvgSpriteCompiler = require('./workers/SvgSpriteCompiler');

const StyleguideCompiler = require('./plugins/StyleguideCompiler');
const StyleOptimizer = require('./plugins/StyleOptimizer');
const JsOptimizer = require('./plugins/JsOptimizer');
const Server = require('./plugins/Server');
const Watcher = require('./plugins/Watcher');
const ConfigManager = require('./common/ConfigManager');

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();

    const Env = new Environment();
    this.env = Env.define();

    this.Console = new Logger(this.env);

    this.config = ConfigManager.load();

    this.services = {
      TaskManager: new TaskManager(),
    };

    this.workers = {
      Cleaner: new Cleaner(this.services),
      FileSync: new FileSync(this.services),
      JsCompiler: new JsCompiler(this.services),
      Resolver: new Resolver(this.services),
      SassCompiler: new SassCompiler(this.services),
      SvgSpriteCompiler: new SvgSpriteCompiler(this.services),
    };

    this.plugins = {
      JsOptimizer: new JsOptimizer(this.services, {
        acceptedEnvironments: 'production',
      }),
      StyleguideCompiler: new StyleguideCompiler(this.services, {}, this.workers),
      Server: new Server(this.services, {
        acceptedEnvironments: 'development',
      }),
      StyleOptimizer: new StyleOptimizer(this.services, {
        acceptedEnvironments: 'production',
      }),
      Watcher: new Watcher(this.services, {
        acceptedEnvironments: 'development',
      }),
    };
  }

  /**
   * Init Harbor and run tasks specified from the Command Line Arguments.
   */
  async init() {
    const { task, ...args } = this.Argv.args;

    try {
      if (task && task.length) {
        const workerResult = await this.services.TaskManager.publish('workers', task);

        // Output the result of the initial build and throw an exception for the
        // production environment.
        if (workerResult) {
          if (workerResult.exceptions && workerResult.exceptions.length) {
            if (this.env.THEME_ENVIRONMENT === 'production') {
              this.Console.error(
                `Not all workers have been completed correctly: ${workerResult.exceptions.join(
                  ', '
                )}`
              );
              throw Error();
            }
          }

          if (workerResult.completed && workerResult.completed.length) {
            if (workerResult.exceptions && !workerResult.exceptions.length) {
              this.Console.success(`Successfully completed ${workerResult.completed.length} tasks`);
            }
          } else if (workerResult.exceptions && workerResult.exceptions.length) {
            this.Console.warning(
              `The following workers did not complete correctly: ${workerResult.exceptions.join(
                ', '
              )}`
            );
          }
        }
      }

      if (args) {
        // Only use the configured plugins for the defined plugin arguments.
        const plugins = Object.keys(args).filter(
          (arg) =>
            args[arg] &&
            Object.values(this.config['plugins']).filter(({ hook }) => {
              const h = hook ? (Array.isArray(hook) ? hook : [String(hook)]) : [];

              if (!h.includes(arg)) {
                return;
              }

              return true;
            }).length
        );

        if (plugins.length) {
          this.Console.log(
            `Using ${plugins.length} ${plugins.length === 1 ? 'plugin' : 'plugins'} for ${
              this.env.THEME_ENVIRONMENT
            }...`
          );

          const pluginResult = await this.services.TaskManager.publish(
            'plugins',
            plugins.join(',')
          );
        }
      }
    } catch (exception) {
      if (exception) {
        throw new Error(exception);
      }
    }
  }

  /**
   * Defines the configuration Object for the Storybook instance.
   */
  styleguideSetup() {
    return this.plugins.StyleguideCompiler.setupTwing(this.env);
  }
}

module.exports = Harbor;
