const browserSync = require('browser-sync');
const { existsSync } = require('fs');
const { resolve } = require('path');

const Plugin = require('./Plugin');

/**
 * Creates a new BrowserSync instance.
 */
class Server extends Plugin {
  constructor(services) {
    super(services);
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  init() {
    this.instance = browserSync.create();

    this.Console.info('Starting the Browsersync development server');

    const serverDirectories = [resolve(this.environment.THEME_DIST)];

    const { sharedDirectories } = this.config.options;

    if (sharedDirectories && Array.isArray(sharedDirectories)) {
      sharedDirectories.forEach((directory) => {
        if (existsSync(resolve(directory))) {
          serverDirectories.push(resolve(directory));
        }
      });
    }

    this.instance.init({
      open: false,
      port: this.environment.THEME_PORT,
      server: serverDirectories,
      watch: true,
      files: [`${resolve(this.environment.THEME_DIST)}/**/*.css`],
    });
  }
}

module.exports = Server;
