const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const { readFileSync, statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname, join } = require('path');
const postcss = require('postcss');
const combineDuplicateSelectors = require('postcss-combine-duplicated-selectors');

const Logger = require('../common/Logger');
const BaseService = require('./BaseService');

class StyleOptimizer extends BaseService {
  constructor() {
    super();
  }

  init(environment) {
    return new Promise((cb) => {
      this.environment = environment;

      if (!this.config.entry instanceof Object) {
        cb();
      }

      let queue = 0;

      const baseDirectories = Object.keys(this.config.entry);

      this.postcssConfig = this.config.options;

      if (!this.environment.THEME_DEVMODE) {
        this.postTHEME_THEME_ssConfig.plugins.push(
          combineDuplicateSelectors({ removeDuplicatedProperties: true })
        );
        this.postcssConfig.plugins.push(cssnano({ mergeLonghand: false }));
      }

      baseDirectories.forEach(async (name) => {
        const cwd = sync(join(this.environment.THEME_DIST, this.config.entry[name]));

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
    return new Promise((cb) => {
      // Keep track of the actual processing queue.
      let queue = 0;

      cwd.forEach(async (entry) => {
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
    return new Promise((cb) => {
      const source = readFileSync(entry);

      Logger.info(`Optimizing: ${entry}`);

      postcss(this.postcssConfig)
        .process(source, {
          from: entry,
        })
        .then(async (result) => {
          result.warnings().forEach((warning) => {
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
    return new Promise((cb) => {
      mkdirp(dirname(entry)).then((dirPath, error) => {
        if (error) {
          Logger.error(error);
        }

        // Write the actual css to the filesystem.
        writeFileSync(`${entry}`, result.css);

        Logger.success(`Successfully optimized: ${entry}`);

        cb();
      });
    });
  }
}

module.exports = StyleOptimizer;
