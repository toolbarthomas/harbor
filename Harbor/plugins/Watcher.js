import chokidar from 'chokidar';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';

import { ConfigManager } from '../common/ConfigManager.js';
import { Plugin } from './Plugin.js';

/**
 * Creates a Watcher instance for each defined instance key and will run the
 * configured hook from the constructed TaskManager.
 */
export class Watcher extends Plugin {
  constructor(services, options) {
    super(services, options);

    this.instances = {};
  }

  /**
   * Spawn a new Watcher instance that publishes the subscribed TaskManager hooks
   * that are also confugured within the initial Watcher configuration.
   *
   * @param {string} hook Creates a new unique watcher from the given hook.
   */
  async init() {
    if (!(this.config.instances instanceof Object)) {
      return;
    }

    const instances = Object.keys(this.config.instances);

    if (!instances.length) {
      return;
    }

    // Enables HMR within the styleguide for the generated assets.
    if (this.environment.THEME_WEBSOCKET_PORT) {
      if (WebSocketServer) {
        this.Console.log(`Preparing Socket...`);

        this.wss = new WebSocketServer({
          port: this.parseEnvironmentProperty('THEME_WEBSOCKET_PORT'),
        });
      }
    }

    // Ensures the plugin is done only if all the defined Watcher instances
    // are closed.
    await new Promise((done) => {
      instances.forEach((name) => {
        if (this.instances[name]) {
          return;
        }

        const query = (
          Array.isArray(this.config.instances[name].path)
            ? this.config.instances[name].path
            : [this.config.instances[name].path]
        ).map((p) => path.join(this.environment.THEME_SRC, p));

        this.Console.log(`Creating Watcher instance: ${name} => ${query.join(', ')}`);

        this.defineWatcher(name, query, done);

        this.wss.on('connection', () => {
          if (!this.instances[name].running) {
            this.Console.log(`No watcher instance exists for ${name}, resuming Watcher`);

            this.defineWatcher(name, query, done);
          }
        });

        this.instances[name].running = true;
      });
    });

    // Ensure the Websocket Server is closed before the Plugin is resolved.
    if (this.wss && this.wss.close) {
      this.Console.log(
        `Closing WebSocket Server at: ${this.parseEnvironmentProperty('THEME_WEBSOCKET_PORT')}`
      );
    }
    super.resolve();
  }

  /**
   * Defines the actual watcher for the given name.
   *
   * @param {String} name The name for the new Watcher instance.
   * @param {Array} query The entry paths for the Chokidar watcher.
   * @param {Function} done The initial worker Promise if the created watcher
   * that should be called to resolve the initial Worker.
   */
  defineWatcher(name, query, done) {
    this.Console.info(`Defining watcher: ${name}.`);

    const { TaskManager } = this.services;

    this.instances[name] = {
      instance: chokidar.watch(
        query,
        Object.assign(this.config.instances[name].options || {}, {
          ignoreInitial: true,
        })
      ),
      running: false,
    };

    this.defineReset(name, done);

    // Create the Shutdown handler that will close the new Watcher after configured
    // time has passed.
    this.instances[name].instance.on(this.config.instances[name].event || 'change', (source) => {
      if (!this.config.instances[name].workers) {
        return;
      }

      if (this.instances[name].watcher) {
        clearTimeout(this.instances[name].watcher);
      }

      if (this.instances[name].reset) {
        clearTimeout(this.instances[name].reset);
      }

      if (!this.instances[name].active) {
        this.instances[name].watcher = setTimeout(async () => {
          this.instances[name].active = true;

          if (this.config.instances[name].event !== 'all') {
            this.Console.info(`File updated ${source}`);
          }

          if (TaskManager) {
            for (let i = 0; i < this.config.instances[name].workers.length; i += 1) {
              const worker = this.config.instances[name].workers[i];

              const { hook } = ConfigManager.load(worker, 'workers');

              // eslint-disable-next-line no-await-in-loop
              await TaskManager.publish('workers', hook || worker);

              if (this.wss && this.wss.clients) {
                this.wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    this.Console.info('Sending update state to Websocket Server');

                    client.send(`Published hook: ${hook || worker}`);
                  }
                });
              }

              this.Console.info(`Resuming watcher: ${name} => ${hook || worker}`);
            }
          }

          this.instances[name].active = null;
        }, this.config.options.delay || 500);

        this.defineReset(name, done);
      }
    });
  }

  /**
   * Defines the Watcher lifecycle reset handler that will autoclose the
   * Watcher instance.
   *
   * @param {string} name The defined Watcher that should reset.
   * @param {function} callback The resolve handler that will be called when
   * the reset has been initiated.
   */
  defineReset(name, callback) {
    if (this.instances[name].reset) {
      this.Console.info(`Resetting watcher instance: ${name} `);
    }

    // The actual shutdown handler that will close the current Watcher.
    this.instances[name].reset = setTimeout(() => {
      if (!this.instances[name].instance.close) {
        return;
      }

      this.Console.log(`Closing watcher instance: ${name}`);

      this.instances[name].instance.close().then(() => {
        this.Console.log(`Watcher instance closed: ${name}`);

        this.instances[name].running = null;

        clearTimeout(this.instances[name].reset);

        if (!Object.values(this.instances).filter(({ running }) => running).length) {
          this.Console.info(
            `Closing file watcher, no changes have been detected within ${
              this.config.options.duration / 1000
            }s`
          );

          // if (this.wss && this.wss.close) {
          //   this.Console.info(`Closing Socket Connection...`);

          //   this.wss.close();
          // }

          return callback();
        }

        return null;
      });
    }, this.config.options.duration || 1000 * 60 * 15);
  }
}
