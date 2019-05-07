const { transform } = require('@babel/core');
const { statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname, join } = require('path');
const Logger = require('./common/Logger');

class JSCompiler {
  init(config) {
    this.cwd = {
      main: sync(`${config.THEME_SRC}/main/javascripts/**/*.js`),
      modules: sync(`${config.THEME_SRC}/modules/*/*/*.js`),
    };

    Object.keys(this.cwd).forEach(directory => {
      const baseDirectory = this.cwd[directory];

      if (baseDirectory.length === 0) {
        Logger.info(`Cannot find any javascript files witin ${join(config.THEME_SRC, directory)}`);
      } else {
        Logger.info(`Transpiling javascripts within: ${join(config.THEME_SRC, directory)}`);

        this.transpile(baseDirectory, config);

        Logger.success(`Done transpiling within ${join(config.THEME_SRC, directory)}`);
      }
    });
  }

  /**
   * Transpile the javascript files defined within the given baseDirectory.
   *
   * @param {Array} baseDirectory Array of javascript files defined from
   * a specific directory.
   */
  transpile(baseDirectory, config) {
    baseDirectory.forEach(entry => {
      if (!statSync(entry).size) {
        Logger.warning(`Skipping empty file: ${entry}`);
      } else {
        Logger.info(`Transpiling: ${entry}`);

        this.source = readFileSync(entry, 'utf8');
        this.transpiledSource = transform(this.source, { presets: ['@babel/env'] });
        this.destination = entry.replace(config.THEME_SRC, config.THEME_DIST);

        /**
         * Create the destination directory before writing the source to
         * the filesystem.
         */
        mkdirp(dirname(this.destination), error => {
          if (error) {
            Logger.error(error);
          }

          writeFileSync(this.destination, this.transpiledSource.code);

          Logger.success(`Successfully transpiled: ${this.destination}`);
        });
      }
    });
  }
}

module.exports = JSCompiler;
