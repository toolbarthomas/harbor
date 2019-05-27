const browserSync = require('browser-sync');
const { existsSync } = require('fs');
const { resolve } = require('path');
const Logger = require('./common/Logger');
const ConfigManager = require('./common/ConfigManager');

class Server {
  init(config) {
    this.instance = browserSync.create();

    Logger.info('Starting the Browsersync development server');

    const serverDirectories = [resolve(config.THEME_DIST)];

    const { sharedDirectories } = ConfigManager.load('server');

    if (sharedDirectories && Array.isArray(sharedDirectories)) {
      sharedDirectories.forEach(directory => {
        if (existsSync(resolve(directory))) {
          serverDirectories.push(resolve(directory));
        }
      });
    }

    this.instance.init({
      open: false,
      port: config.THEME_PORT,
      server: serverDirectories,
      watch: true,
      files: [`${resolve(config.THEME_DIST)}/**/*.css`],
    });
  }
}

module.exports = Server;
