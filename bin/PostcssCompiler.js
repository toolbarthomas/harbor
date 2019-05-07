const { statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');
const { load } = require('module-config-loader');
const postcss = require('postcss');
const Logger = require('./common/Logger');

class PostcssCompiler {
  init(config) {
    this.config = config;

    this.cwd = {
      main: sync(`${this.config.THEME_SRC}/main/stylesheets/*.css`),
      modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.css`),
    };

    this.postcssConfig = load('postcss.config.js');

    Object.keys(this.cwd).forEach(async directory => {
      if (this.cwd[directory].length === 0) {
        Logger.info(`Cannot find any stylesheet witin ${join(this.config.THEME_SRC, directory)}`);
      } else {
        await this.processCwd(directory);
      }
    });
  }

  /**
   * Process all stylesheets within the defined baseDirectory asynchronously.
   *
   * @param {String} directory Key name of the defined cwd Array.
   */
  processCwd(directory) {
    const cwd = this.cwd[directory];

    // Keep track of the actual processing queue.
    let renderQueue = 0;

    /**
     * Use an adjustable limit in order to return the Promise Callback even if
     * some files were not processed correctly.
     */
    let renderLimit = cwd.length;

    Logger.info(`Compiling stylesheets within: ${join(this.config.THEME_SRC, directory)}`);

    return new Promise(cb => {
      cwd.forEach(async entry => {
        if (!statSync(entry).size) {
          Logger.warning(`Skipping empty file: ${entry}`);

          renderLimit -= 1;
        } else {
          await this.process(entry);

          renderQueue += 1;
        }

        /**
         * Only return the Promise Callback after each entry file has been
         * processed.
         */
        if (renderQueue >= renderLimit) {
          Logger.success(`Done compiling within ${join(this.config.THEME_SRC, directory)}`);

          cb();
        }
      });
    });
  }

  /**
   * Process the defined stylesheet asynchronously.
   *
   * @param {String} entry The sourcepath of the actual stylesheet.
   */
  process(entry) {
    const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);
    const source = readFileSync(entry);

    Logger.info(`Compiling: ${entry}`);

    return new Promise(cb => {
      postcss(this.postcssConfig.plugins)
        .process(source, {
          from: entry,
        })
        .then(result => {
          result.warnings().forEach(warning => {
            Logger.warning(warning.toString());
          });

          mkdirp(dirname(destination), error => {
            if (error) {
              Logger.error(error);
            }

            // Write the actual css to the filesystem.
            writeFileSync(destination, result.css);

            Logger.success(`Successfully compiled: ${destination}`);

            cb();
          });
        });
    });
  }
}

module.exports = PostcssCompiler;
