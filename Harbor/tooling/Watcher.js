const chokidar = require('chokidar');
const { extname, join } = require('path');

const ConfigManager = require('../common/ConfigManager');
const { pathToFileURL } = require('url');

class Watcher {
  constructor(services) {
    this.name = this.constructor.name;

    this.config = ConfigManager.load(this.name);

    this.services = services;

    this.instances = {};
  }

  async spawn(environment, Console) {
    this.environment = environment;

    this.Console = Console;

    if (!this.config.instances instanceof Object) {
      return;
    }

    const instances = Object.keys(this.config.instances);

    if (!instances.length) {
      return;
    }

    await new Promise((done) => {
      instances.forEach((name) => {
        if (this.instances[name]) {
          return;
        }

        const query = (Array.isArray(this.config.instances[name].path)
          ? this.config.instances[name].path
          : [this.config.instances[name].path]
        ).map((p) => join(this.environment.THEME_SRC, p));

        this.Console.info(`Creating ${name} watcher: ${query.join(', ')}`);

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

        this.instances[name].instance.on(this.config.instances[name].event || 'change', (path) => {
          this.config.instances[name].services.forEach((service) => {
            clearTimeout(this.instances[name].watcher);

            if (!this.instances[name].active) {
              this.instances[name].watcher = setTimeout(async () => {
                this.instances[name].active = true;

                if (this.config.instances[name].event === 'change') {
                  this.Console.info(`File changed, starting ${service}`);
                }

                await this.services[service].init();

                this.instances[name].active = false;
              }, this.config.options.delay || 500);
            }
          });
        });

        this.instances[name].reset = setTimeout(() => {
          if (!this.instances[name].instance.close) {
            return;
          }

          this.Console.log(`Closing watcher: ${name}`);

          this.instances[name].instance.close().then(() => {
            this.Console.log(`Watcher closed: ${name}`);

            this.instances[name].running = null;
            clearTimeout(this.instances[name].running);

            if (!Object.values(this.instances).filter(({ running }) => running).length) {
              this.Console.info('Finished Watcher');

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
