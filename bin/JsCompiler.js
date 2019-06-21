const { transform } = require('@babel/core');
const { statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname } = require('path');
const Logger = require('./common/Logger');

class JsCompiler {
  init(config) {
    return new Promise(cb => {
      this.config = config;

      this.cwd = {
        main: sync(`${this.config.THEME_SRC}/main/javascripts/**/*.js`),
        modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.js`),
      };

      const baseDirectories = Object.keys(this.cwd);

      let queue = 0;

      baseDirectories.forEach(async directory => {
        const cwd = this.cwd[directory];

        if (cwd.length > 0) {
          await this.transpileCwd(cwd);
        }

        queue += 1;

        if (queue >= baseDirectories.length) {
          cb();
        }
      });
    });
  }

  /**
   * Transpile the javascript files defined within the given baseDirectory.
   *
   * @param {Array} cwd Array of javascript files to process.
   */
  transpileCwd(cwd) {
    return new Promise(cb => {
      // Keep track of the actual processing queue.
      let queue = 0;

      cwd.forEach(entry => {
        queue += 1;

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

            /**
             * Resolve the actual Promise if all files within the current cwd
             * are transpiled.
             */
            if (queue >= cwd.length) {
              cb();
            }
          });
        }
      });
    });
  }
}

module.exports = JsCompiler;
