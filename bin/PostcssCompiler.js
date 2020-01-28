const { readFileSync, statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { load } = require('module-config-loader');
const { dirname } = require('path');
const postcss = require('postcss');
const stylelint = require('stylelint');
const Logger = require('./common/Logger');

class PostcssCompiler {
  constructor() {
    this.styleLintError = false;
  }

  init(config) {
    return new Promise(cb => {
      this.config = config;

      this.cwd = {
        main: sync(`${this.config.THEME_SRC} / main / stylesheets/*.css`),
        modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.css`),
      };

      const baseDirectories = Object.keys(this.cwd);

      this.postcssConfig = load('postcss.config.js');

      if (Array.isArray(this.postcssConfig.plugins)) {
        this.postcssConfig.plugins.push(stylelint());
      } else if (this.postcssConfig.plugins instanceof Object) {
        this.postcssConfig.plugins.stylelint = {};
      }

      // Include the stylelinter.
      this.postcssConfig = Object.assign(this.postcssConfig, {
        plugins: [],
        extends: ['stylelint-config-recommended', 'stylelint'],
      });

      let queue = 0;

      baseDirectories.forEach(async directory => {
        const cwd = this.cwd[directory];

        if (cwd.length > 0) {
          await this.processCwd(cwd);
        }

        queue += 1;

        if (queue >= baseDirectories.length) {
          cb();
        }
      });
    });
  }

  /**
   * Process all stylesheets within the defined cwd asynchronously.
   *
   * @param {Array} cwd The actual array to process.
   */
  processCwd(cwd) {
    return new Promise(cb => {
      // Keep track of the actual processing queue.
      let queue = 0;

      cwd.forEach(async entry => {
        if (!statSync(entry).size) {
          Logger.warning(`Skipping empty file: ${entry}`);
        } else {
          await this.processFile(entry);
        }

        queue += 1;

        /**
         * Only return the Promise Callback after each entry file has been
         * processed.
         */
        if (queue >= cwd.length) {
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
  processFile(entry) {
    return new Promise(cb => {
      const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);
      const source = readFileSync(entry);

      Logger.info(`Compiling: ${entry}`);

      postcss(this.postcssConfig.plugins)
        .process(source, {
          from: entry,
        })
        .then(result => {
          result.warnings().forEach(warning => {
            Logger.warning(warning.toString());
          });

          mkdirp(dirname(destination)).then((dirPath, error) => {
            if (error) {
              Logger.error(error);
            } else {
              // Write the actual css to the filesystem.
              writeFileSync(destination, result.css);

              Logger.success(`Done compiling: ${destination}`);
            }

            cb();
          });
        });
    });
  }
}

module.exports = PostcssCompiler;
