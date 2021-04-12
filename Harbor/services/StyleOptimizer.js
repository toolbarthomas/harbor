const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const { readFileSync, statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname, join } = require('path');
const postcss = require('postcss');
const combineDuplicateSelectors = require('postcss-combine-duplicated-selectors');

const BaseService = require('./BaseService');

class StyleOptimizer extends BaseService {
  constructor() {
    super();
  }

  async init(environment) {
    this.environment = environment;

    if (!this.config.entry instanceof Object) {
      cb();
    }

    this.postcssConfig = {
      plugins: this.config.plugins || [],
    };

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return;
    }

    if (!this.environment.THEME_DEVMODE) {
      this.postcssConfig.plugins.push(
        combineDuplicateSelectors({ removeDuplicatedProperties: true })
      );
      this.postcssConfig.plugins.push(cssnano({ mergeLonghand: false }));
    }

    await Promise.all(
      entries.map(
        (name) =>
          new Promise((cb) => {
            const cwd = sync(join(this.environment.THEME_DIST, this.config.entry[name]));

            if (cwd.length > 0) {
              this.optimizeCwd(cwd).then(() => cb());
            } else {
              cb();
            }
          })
      )
    );
  }

  /**
   * Optimize each stylesheet within the defined baseDirectory.
   *
   * @param {Array} cwd The actual array to process.
   */
  optimizeCwd(cwd) {
    return new Promise((done) => {
      Promise.all(
        cwd.map(
          (entry) =>
            new Promise((cb) => {
              if (!statSync(entry).size) {
                return cb();
              }

              this.optimizeFile(entry).then(() => cb());
            })
        )
      ).then(() => done());
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

      this.Console.log(`Optimizing: ${entry}`);

      postcss(this.postcssConfig)
        .process(source, {
          from: entry,
        })
        .then(async (result) => {
          result.warnings().forEach((warning) => {
            this.Console.warning(warning.toString());
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
          this.Console.error(error);
        }

        // Write the actual css to the filesystem.
        writeFileSync(`${entry}`, result.css);

        this.Console.log(`Successfully optimized: ${entry}`);

        cb();
      });
    });
  }
}

module.exports = StyleOptimizer;
