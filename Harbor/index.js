import { Argv } from './common/Argv.js';
import { ConfigManager } from './common/ConfigManager.js';
import { Environment } from './common/Environment.js';
import { Logger } from './common/Logger.js';

import { ConfigPublisher } from './services/ConfigPublisher.js';
import { TaskManager } from './services/TaskManager.js';

import { AssetExporter } from './workers/AssetExporter.js';
import { Cleaner } from './workers/Cleaner.js';
import { FileSync } from './workers/FileSync.js';
import { JsCompiler } from './workers/JsCompiler.js';
import { Resolver } from './workers/Resolver.js';
import { SassCompiler } from './workers/SassCompiler.js';
import { StyleguideHelper } from './workers/StyleguideHelper.js';
import { StyleguideTester } from './workers/StyleguideTester.js';
import { SvgSpriteCompiler } from './workers/SvgSpriteCompiler.js';

import { JsOptimizer } from './plugins/JsOptimizer.js';
import { StyleguideCompiler } from './plugins/StyleguideCompiler.js';
import { StyleOptimizer } from './plugins/StyleOptimizer.js';
import { Watcher } from './plugins/Watcher.js';

/**
 * Factory setup for Harbor.
 */
export class Harbor {
  constructor() {
    this.Argv = new Argv();

    this.services = {
      ConfigPublisher: new ConfigPublisher(['Console']),
      TaskManager: new TaskManager(['Console', 'environment']),
    };

    this.workers = {
      AssetExporter: new AssetExporter(this.services, {}),
      Cleaner: new Cleaner(this.services),
      FileSync: new FileSync(this.services),
      JsCompiler: new JsCompiler(this.services),
      Resolver: new Resolver(this.services),
      SassCompiler: new SassCompiler(this.services),
      StyleguideHelper: new StyleguideHelper(this.services),
      StyleguideTester: new StyleguideTester(this.services),
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
    const { ci, task, isProduction, staticDirectory, ...args } = this.Argv.args;
    const { customArgs } = args;

    const Env = new Environment();
    this.env = await Env.define();

    this.Console = new Logger(this.env);

    if (ci) {
      this.Console.info(`Launcing Harbor in CI mode...`);
    }
    this.env.THEME_AS_CLI = ci;

    if (isProduction) {
      this.Console.warning(
        `Heads up! Harbor will run this instance in production when the 'isProduction' flag is enabled. `
      );
      this.env.THEME_ENVIRONMENT = 'production';
    }

    if (staticDirectory) {
      this.Console.log(`Enforcing custom render directory: ${staticDirectory}`);
      this.env.THEME_STATIC_DIRECTORY = staticDirectory;
    }

    // Defines the actual test suite command for Backstopjs.
    if (args.test) {
      this.env.THEME_TEST_PHASE = args.test;
    }

    // Keep track of the arguments that were not recognized by Harbor.
    const unusedCustomArgs = customArgs;
    const config = await ConfigManager.load();

    this.Console.log(`Starting Harbor...`);

    // Assign the defined Console & environment to the TaskManager service.
    this.services.TaskManager.mount('Console', this.Console);
    this.services.TaskManager.mount('environment', this.env);

    this.services.ConfigPublisher.mount('Console', this.Console);

    this.share(this.workers, 'workers', config);
    this.share(this.plugins, 'plugins', config);

    // Ensure the configuration is defined before mounting anything.
    this.mount(this.workers, config);

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
        this.mount(this.plugins, config);

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
        this.Console.error('Harbor stopped because of an error: exception');

        process.exit(1);
      }
    }
  }

  /**
   * Defines the required properties for the defined Harbor worker or plugin.
   */
  mount(instances, config) {
    if (instances instanceof Object) {
      Object.keys(instances).forEach((name) => {
        const Instance = instances[name];
        const { hook } = config[Instance.type][name];
        const h = Array.isArray(hook) ? hook : [hook];

        // Define the environment for the current name.
        Instance.defineEnvironment(this.env || {});

        // Inherit the already created Console.
        Instance.defineConsole(this.Console);

        // Define the configuration for the current name.
        Instance.defineConfig(config[Instance.type][name]);

        // Define the configuration for the current name.
        Instance.defineEntry();

        // Subscribe the current name to the Harbor TaskManager.
        Instance.subscribe(hook && hook !== name ? [name, ...h] : [...h]);
      });
    }
  }

  /**
   * Expose the worker & plugin configuration to the ConfigPublisher
   */
  share(instance, type, config) {
    if (!this.services || !this.services.ConfigPublisher) {
      return;
    }

    const s = (n, t) =>
      config[t][n] && this.services.ConfigPublisher.subscribe(n, config[t][n].options);

    if (instance) {
      Object.keys(instance).forEach((n) => s(n, type));
    }
  }

  /**
   * Validates the results of all used workers & plugins in order to define the
   * final result of the running Harbor instance.
   */
  validateResult(results) {
    if (results && results.exceptions && results.exceptions.length) {
      if (this.env.THEME_ENVIRONMENT !== 'development') {
        this.Console.error(
          `Not all tasks have been completed correctly: ${results.exceptions.join(', ')}`
        );

        process.exit(1);
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
