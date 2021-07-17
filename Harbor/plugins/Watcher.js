import chokidar from 'chokidar';
import path from 'path';
import WebSocket from 'ws';

import ConfigManager from '../common/ConfigManager.js';
import Plugin from './Plugin.js';

/**
 * Creates a Watcher instance for each defined instance key and will run the
 * configured hook from the constructed TaskManager.
 */
class Watcher extends Plugin {
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
    const { TaskManager } = this.services;

    if (!(this.config.instances instanceof Object)) {
      return;
    }

    const instances = Object.keys(this.config.instances);

    if (!instances.length) {
      return;
    }

    // Enables HMR within the styleguide for the generated assets.
    if (this.environment.THEME_WEBSOCKET_PORT) {
      if (WebSocket) {
        this.Console.log(`Preparing Socket...`);

        this.wss = new WebSocket.Server({
          port: this.environment.THEME_WEBSOCKET_PORT,
        });

        this.wss.on('connection', () => {
          this.Console.log(`Client connection established!`);
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

        // Setup the actual Watcher.
        this.instances[name] = {
          watcher: null,
          instance: chokidar.watch(
            query,
            Object.assign(this.config.instances[name].options || {}, {
              ignoreInitial: true,
            })
          ),
          active: false,
          running: false,
        };

        // Create the Shutdown handler that will close the new Watcher after configured
        // time has passed.
        this.instances[name].instance.on(
          this.config.instances[name].event || 'change',
          (source) => {
            if (!this.config.instances[name].workers) {
              return;
            }

            this.config.instances[name].workers.forEach((worker) => {
              this.Console.log('Resetting shutdown timer...');
              clearTimeout(this.instances[name].watcher);
              clearTimeout(this.instances[name].reset);

              this.defineReset(name, done);

              if (!this.instances[name].active) {
                this.instances[name].watcher = setTimeout(async () => {
                  this.instances[name].active = true;

                  if (this.config.instances[name].event !== 'all') {
                    this.Console.info(`File updated ${source}`);
                  }

                  if (TaskManager) {
                    const { hook } = ConfigManager.load(worker, 'workers');

                    await TaskManager.publish('workers', hook || worker);

                    if (this.wss.clients) {
                      this.wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                          this.Console.info('Sending update state to Websocket Server');

                          client.send(`Published hook: ${hook || worker}`);
                        }
                      });
                    }

                    this.Console.info(`Resuming watcher: ${name}`);
                  }

                  this.instances[name].active = false;
                }, this.config.options.delay || 500);
              }
            });
          }
        );

        this.defineReset(name, done);

        this.instances[name].running = true;
      });
    });

    super.resolve();
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

          if (this.wss && this.wss.close) {
            this.Console.info(`Closing Socket Connection...`);

            this.wss.close();
          }

          return callback();
        }

        return null;
      });
    }, this.config.options.duration || 1000 * 60 * 15);
  }
}

export default Watcher;
