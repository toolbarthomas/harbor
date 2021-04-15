const chokidar = require('chokidar');
const { extname, join } = require('path');

const ConfigManager = require('../common/ConfigManager');
const { pathToFileURL } = require('url');
const Environment = require('../common/Environment');
const Logger = require('../common/Logger');

/**
 * Creates a Watcher instance for each defined instance key and will run the
 * configured hook from the constructed TaskManager.
 */
class Watcher {
  constructor(TaskManager) {
    this.name = this.constructor.name;

    this.config = ConfigManager.load(this.name);

    this.TaskManager = TaskManager;
    this.instances = {};
  }

  /**
   * Spawn a new Watcher instance that publishes the subscribed TaskManager hooks
   * that are also confugured within the initial Watcher configuration.
   *
   * @param {string} hook Creates a new unique watcher from the given hook.
   */
  async spawn(hook) {
    const environment = new Environment();

    this.environment = environment.define();

    this.Console = new Logger(this.environment);

    if (!hook) {
      return;
    }

    const list = hook.split(',').map((t) => {
      return t.trim();
    });

    if (!list.length || !list.includes('watch')) {
      return;
    }

    if (!this.config.instances instanceof Object) {
      return;
    }

    const instances = Object.keys(this.config.instances);

    if (!instances.length) {
      return;
    }

    this.Console.info('Starting service Watcher...');

    await new Promise((done) => {
      instances.forEach((name) => {
        if (this.instances[name]) {
          return;
        }

        const query = (Array.isArray(this.config.instances[name].path)
          ? this.config.instances[name].path
          : [this.config.instances[name].path]
        ).map((p) => join(this.environment.THEME_SRC, p));

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
        this.instances[name].instance.on(this.config.instances[name].event || 'change', (path) => {
          this.config.instances[name].services.forEach((service) => {
            this.Console.log('Resetting shutdown timer...');
            clearTimeout(this.instances[name].watcher);

            if (!this.instances[name].active) {
              this.instances[name].watcher = setTimeout(async () => {
                this.instances[name].active = true;

                if (this.config.instances[name].event !== 'all') {
                  this.Console.info(`File updated ${path}`);
                }

                if (this.TaskManager) {
                  const { hook } = ConfigManager.load(service);

                  this.TaskManager.publish(hook || service);
                }

                this.instances[name].active = false;
              }, this.config.options.delay || 500);
            }
          });
        });

        // The actual shutdown handler that will close the current Watcher.
        this.instances[name].reset = setTimeout(() => {
          if (!this.instances[name].instance.close) {
            return;
          }

          this.Console.log(`Closing watcher instance: ${name}`);

          this.instances[name].instance.close().then(() => {
            this.Console.log(`Watcher instance closed: ${name}`);

            this.instances[name].running = null;
            clearTimeout(this.instances[name].running);

            if (!Object.values(this.instances).filter(({ running }) => running).length) {
              this.Console.info('Closing service Watcher...');

              done();
            }
          });
        }, this.config.options.duration || 1000 * 60 * 15);

        this.instances[name].running = true;
      });
    });
  }
}

module.exports = Watcher;
