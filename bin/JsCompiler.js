const { transform } = require('@babel/core');
const { statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname, join } = require('path');
const Logger = require('./common/Logger');

class JsCompiler {
  init(config) {
    this.config = config;

    this.cwd = {
      main: sync(`${this.config.THEME_SRC}/main/javascripts/**/*.js`),
      modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.js`),
    };

    Object.keys(this.cwd).forEach(directory => {
      const baseDirectory = this.cwd[directory];

      if (baseDirectory.length === 0) {
        Logger.info(
          `Cannot find any javascript files witin ${join(this.config.THEME_SRC, directory)}`
        );
      } else {
        Logger.info(`Transpiling javascripts within: ${join(this.config.THEME_SRC, directory)}`);

        this.transpile(baseDirectory, this.config);

        Logger.success(`Done transpiling within ${join(this.config.THEME_SRC, directory)}`);
      }
    });
  }

  /**
   * Transpile the javascript files defined within the given baseDirectory.
   *
   * @param {Array} baseDirectory Array of javascript files defined from
   * a specific directory.
   */
  transpile(baseDirectory) {
    baseDirectory.forEach(entry => {
      if (!statSync(entry).size) {
        Logger.warning(`Skipping empty file: ${entry}`);
      } else {
        Logger.info(`Transpiling: ${entry}`);

        const source = readFileSync(entry);
        const transpiledSource = transform(source, { presets: ['@babel/env'] });
        const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);

        /**
         * Create the destination directory before writing the source to
         * the filesystem.
         */
        mkdirp(dirname(destination), error => {
          if (error) {
            Logger.error(error);
          }

          writeFileSync(destination, transpiledSource.code);

          Logger.success(`Successfully transpiled: ${destination}`);
        });
      }
    });
  }
}

module.exports = JsCompiler;
