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
      server: {
        baseDir: resolve(config.THEME_DIST),
        directory: true,
      },
      watch: true,
      files: [`${resolve(config.THEME_DIST)}/**/*.css`],
    });
  }
}

module.exports = Server;
