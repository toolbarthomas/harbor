const browserSync = require('browser-sync');
const { resolve } = require('path');
const Logger = require('./common/Logger');

class Server {
  init(config) {
    this.instance = browserSync.create();

    Logger.info('Starting the Browsersync development server');

    this.instance.init({
      open: false,
      port: config.THEME_PORT,
      server: [resolve(config.THEME_DIST)],
      watch: true,
    });
  }
}

module.exports = Server;
