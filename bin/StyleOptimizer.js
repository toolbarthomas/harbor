const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const { readFileSync, statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname } = require('path');
const postcss = require('postcss');
const combineDuplicateSelectors = require('postcss-combine-duplicated-selectors');
const Logger = require('./common/Logger');

class StyleOptimizer {
  init(config) {
    return new Promise(cb => {
      this.config = config;

      this.cwd = {
        main: sync(`${config.THEME_DIST}/main/stylesheets/*.css`),
        modules: sync(`${config.THEME_DIST}/modules/*/*/*.css`),
      };

      const baseDirectories = Object.keys(this.cwd);

      this.postcssConfig = {
        plugins: [autoprefixer()],
      };

      if (!config.THEME_DEVMODE) {
        this.postcssConfig.plugins.push(
          combineDuplicateSelectors({ removeDuplicatedProperties: true })
        );
        this.postcssConfig.plugins.push(cssnano({ mergeLonghand: false }));
      }

      let queue = 0;

      baseDirectories.forEach(async directory => {
        const cwd = this.cwd[directory];

        if (cwd.length > 0) {
          await this.optimizeCwd(cwd);
        }

        queue += 1;

        if (queue >= baseDirectories.length) {
          cb();
        }
      });
    });
  }

  /**
   * Optimize each stylesheet within the defined baseDirectory.
   *
   * @param {Array} cwd The actual array to process.
   */
  optimizeCwd(cwd) {
    return new Promise(cb => {
      // Keep track of the actual processing queue.
      let queue = 0;

      cwd.forEach(async entry => {
        if (statSync(entry).size) {
          await this.optimizeFile(entry);
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
   * Optimize the stylesheet from the defined entry path.
   *
   * @param {String} entry Path of the stylesheet to optimize.
   */
  optimizeFile(entry) {
    return new Promise(cb => {
      const source = readFileSync(entry);

      Logger.info(`Optimizing: ${entry}`);

      postcss(this.postcssConfig)
        .process(source, {
          from: entry,
        })
        .then(async result => {
          result.warnings().forEach(warning => {
            Logger.warning(warning.toString());
          });

          await this.writeFile(entry, result);

          cb();
        });
    });
  }

  /**
   * Writes the optimized stylesheet to the Filesystem.
   *
   * @param {String} entry Path of the stylesheet.
   * @param {Object} result The optimized code of the entry stylesheet.
   */
  writeFile(entry, result) {
    return new Promise(cb => {
      mkdirp(dirname(entry)).then((dirPath, error) => {
        if (error) {
          Logger.error(error);
        }

        // Write the actual css to the filesystem.
        writeFileSync(`${entry}`, result.css);

        Logger.success(`Successfully optimized: ${entry}`);

        cb();
      });
    })
  }
}

module.exports = StyleOptimizer;
