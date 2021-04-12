const browserSync = require('browser-sync');
const { existsSync } = require('fs');
const { resolve } = require('path');

const BaseService = require('./BaseService');

class Server extends BaseService {
  constructor(environment, Console) {
    super(environment, Console);
  }

  init() {
    super.init();

    this.instance = browserSync.create();

    this.Console.info('Starting the Browsersync development server');

    const serverDirectories = [resolve(environment.THEME_DIST)];

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
