const { dirname, join } = require('path');
const { readFileSync, statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const autoprefixer = require('autoprefixer');
const mkdirp = require('mkdirp');
const postcss = require('postcss');

const BaseService = require('./BaseService');

class StyleOptimizer extends BaseService {
  constructor(tooling) {
    super(tooling);
  }

  async init() {
    super.init();

    if (!this.config.entry instanceof Object) {
      cb();
    }

    this.postcssConfig = {
      plugins: [this.config.plugins.autoprefixer],
    };

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return;
    }

    if (!this.environment.THEME_DEVMODE) {
      if (this.config.plugins.cssnano) {
        this.postcssConfig.plugins.push(this.config.plugins.cssnano);
      }

      if (this.config.plugins.combineDuplicateSelectors) {
        this.postcssConfig.plugins.push(this.config.plugins.combineDuplicateSelectors);
      }
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

    super.resolve();
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

      postcss(this.postcssConfig.plugins)
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
