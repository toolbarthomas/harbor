import Argv from './common/Argv.js';
import Environment from './common/Environment.js';
import Logger from './common/Logger.js';

import TaskManager from './services/TaskManager.js';

import Cleaner from './workers/Cleaner.js';
import FileSync from './workers/FileSync.js';
import JsCompiler from './workers/JsCompiler.js';
import Resolver from './workers/Resolver.js';
import SassCompiler from './workers/SassCompiler.js';
import SvgSpriteCompiler from './workers/SvgSpriteCompiler.js';

import StyleguideCompiler from './plugins/StyleguideCompiler.js';
import StyleOptimizer from './plugins/StyleOptimizer.js';
import JsOptimizer from './plugins/JsOptimizer.js';
import Watcher from './plugins/Watcher.js';
import ConfigManager from './common/ConfigManager.js';

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();

    const Env = new Environment();
    this.env = Env.define();

    this.Console = new Logger(this.env);

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
      JsOptimizer: new JsOptimizer(this.services, {}),
      StyleguideCompiler: new StyleguideCompiler(this.services, {}, this.workers),
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
    const { customArgs } = args;

    // Keep track of the arguments that were not recognized by Harbor.
    const unusedCustomArgs = customArgs;
    const config = await ConfigManager.load();

    this.Console.info(`Starting Harbor...`);

    // Ensure the configuration is defined before mounting anything.
    Harbor.mount(this.workers, config);

    const tasks = [task].filter((t) => t);
    if (!tasks || !tasks.length) {
      this.services.TaskManager.workerHooks().forEach((hook) => {
        if (Object.keys(customArgs).includes(hook.split('::')[0])) {
          tasks.push(hook.split('::')[0]);

          // Mark the custom argument as valid task.
          delete unusedCustomArgs[hook.split('::')[0]];
        }
      });
    }

    // Load the required plugins.
    const plugins = Object.keys(args).filter(
      (arg) =>
        args[arg] &&
        Object.values(config.plugins).filter(({ hook }) => {
          const transformHook = Array.isArray(hook) ? hook : [hook && String(hook)];
          const h = hook ? transformHook : [];

          if (!h.includes(String(arg).split('::')[0])) {
            return false;
          }

          return true;
        }).length
    );

    try {
      if (tasks.length || !plugins.length) {
        const workerResult = await this.services.TaskManager.publishWorkers(
          tasks.length ? tasks : ['default']
        );

        // Output the result of the initial build and throw an exception for the
        // production environment.
        this.validateResult(workerResult);
      } else if (!Environment.hasBuild(this.env)) {
        this.Console.warning('Nothing has been processed for this current build!');
      }

      // Mount the actual plugins when all workers are completed to ensure
      // the plugin entries are defined correctly.
      if (plugins.length) {
        Harbor.mount(this.plugins, config);

        this.Console.log(
          `Using ${plugins.length} ${plugins.length === 1 ? 'plugin' : 'plugins'} for ${
            this.env.THEME_ENVIRONMENT
          }...`
        );

        const pluginResult = await this.services.TaskManager.publishPlugins(
          plugins.join(','),
          plugins
        );

        this.validateResult(pluginResult);
      }

      if (Object.keys(unusedCustomArgs).length) {
        this.Console.warning(
          `The given command line arguments are not recognized by Harbor: ${Object.keys(
            unusedCustomArgs
          ).join(', ')}`
        );

        Object.keys(unusedCustomArgs).forEach((unusedCustomArg) => {
          if (Object.keys(args).includes(unusedCustomArg.split(':')[0])) {
            this.Console.info(
              `Did you mean: '${unusedCustomArg.split(':')[0]}' instead of ${unusedCustomArg}?`
            );
          }
        });
      }
    } catch (exception) {
      if (exception) {
        this.Console.error('Harbor stopped because of an error:');

        throw Error(exception.toString());
      }
    }
  }

  /**
   * Defines the required properties for the defined Harbor worker or plugin.
   */
  static mount(instances, config) {
    if (instances instanceof Object) {
      Object.keys(instances).forEach((name) => {
        const handler = instances[name];
        const { hook } = config[handler.type][name];
        const h = Array.isArray(hook) ? hook : [hook];

        // Define the configuration for the current name.
        handler.defineConfig(config[handler.type][name]);

        // Define the configuration for the current name.
        handler.defineEntry();

        // Subscribe the current name to the Harbor TaskManager.
        handler.subscribe(hook && hook !== name ? [name, ...h] : [...h]);
      });
    }
  }

  /**
   * Validates the results of all used workers & plugins in order to define the
   * final result of the running Harbor instance.
   */
  validateResult(results) {
    if (results && results.exceptions && results.exceptions.length) {
      if (this.env.THEME_ENVIRONMENT !== 'development') {
        throw Error(
          `Not all tasks have been completed correctly: ${results.exceptions.join(', ')}`
        );
      }
    }

    if (results && results.completed && results.completed.length) {
      if (results.exceptions && !results.exceptions.length) {
        this.Console.success(`Successfully completed: ${results.completed.join(', ')}`);
      }
    } else if (results && results.exceptions && results.exceptions.length) {
      this.Console.warning(
        `The following task did not complete correctly: ${results.exceptions.join(', ')}`
      );
    }
  }
}

export default Harbor;
