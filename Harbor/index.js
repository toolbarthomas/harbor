import fs from 'fs';

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
export default class Harbor {
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
      JsOptimizer: new JsOptimizer(this.services, {
        acceptedEnvironments: 'production',
      }),
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
    const config = await ConfigManager.load();

    this.mount(this.workers, config);

    this.mount(this.plugins, config);

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
            Object.values(config['plugins']).filter(({ hook }) => {
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
        throw new Error(
          `Harbor encounterd an error and could not continue: ${exception.toString()}`
        );
      }
    }
  }

  /**
   * Mounts the defined instance with the defined configuration.
   */
  mount(instances, config) {
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
}
