import path from 'path';
import fs from 'fs';
import autoprefixer from 'autoprefixer';
import mkdirp from 'mkdirp';
import postcss from 'postcss';

import Plugin from './Plugin.js';

/**
 * Optimizes the compiled stylesheet entries within the defined THEME_DIST
 * directory.
 */
class StyleOptimizer extends Plugin {
  constructor(services, options) {
    super(services, options);
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    this.postcssConfig = {
      plugins: [this.config.plugins.autoprefixer],
    };

    if (this.environment.THEME_ENVIRONMENT === 'production') {
      if (this.config.plugins.cssnano) {
        this.postcssConfig.plugins.push(this.config.plugins.cssnano);
      }

      if (this.config.plugins.combineDuplicateSelectors) {
        this.postcssConfig.plugins.push(this.config.plugins.combineDuplicateSelectors);
      }
    }

    await Promise.all(
      this.entry.map(
        (entry) =>
          new Promise((cb) => {
            if (entry.length) {
              this.optimizeCwd(entry).then(cb);
            } else {
              this.Console.warning(`Unable to find entry from: ${p}`);
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
      Promise.all(cwd.map((entry) => new Promise((cb) => this.optimizeFile(entry).then(cb)))).then(
        done
      );
    });
  }

  /**
   * Optimize the stylesheet from the defined entry path.
   *
   * @param {String} entry Path of the stylesheet to optimize.
   */
  optimizeFile(entry) {
    return new Promise((done) => {
      fs.readFile(entry, (exception, source) => {
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

            done();
          });
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
    return new Promise((done) => {
      mkdirp(path.dirname(entry)).then((dirPath, error) => {
        if (error) {
          this.Console.error(error);
          return super.reject();
        }

        // Write the actual css to the filesystem.
        fs.writeFile(entry, result.css, () => {
          this.Console.log(`Successfully optimized: ${entry}`);

          done();
        });
      });
    });
  }
}

export default StyleOptimizer;
