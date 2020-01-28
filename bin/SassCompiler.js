const { statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { basename, dirname } = require('path');
const mkdirp = require('mkdirp');
const { render } = require('node-sass');
const globImporter = require('node-sass-glob-importer');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const stylelint = require('stylelint');

const Logger = require('./common/Logger');

class SassCompiler {
  constructor() {
    /**
     * Flag to prevent files from being written to the Filesystem if the given
     * file has any Stylelint errors.
     */
    this.stylelintError = false;

    /**
     * Store commonly used Sass styles to interchange these without writing it
     * to the Filesystem.
     */
    this.commonData = '';
  }

  init(config) {
    return new Promise(cb => {
      this.config = config;

      this.cwd = {
        main: sync(`${this.config.THEME_SRC}/main/stylesheets/*.scss`),
      };

      const baseDirectories = Object.keys(this.cwd);

      this.postcssConfig = {
        plugins: [stylelint()],
        extends: ['stylelint-config-recommended-scss', 'stylelint-scss'],
      };

      let queue = 0;

      baseDirectories.forEach(async directory => {
        const cwd = this.cwd[directory];

        if (cwd.length > 0) {
          await this.renderCwd(cwd);
        }

        queue += 1;

        if (queue >= baseDirectories.length) {
          cb();
        }
      });
    });
  }

  /**
   * Compiles each entry Sass file within the defined cwd asynchronously.
   *
   * @param {Array} cwd The actual array to process.
   */
  renderCwd(cwd) {
    return new Promise(cb => {
      // Keep track of the actual processing queue.
      let queue = 0;

      cwd.forEach(async entry => {
        if (String(basename(entry)).indexOf('_') !== 0) {
          if (!statSync(entry).size) {
            Logger.warning(`Skipping empty file: ${entry}`);
          } else {
            await this.lintFile(entry);
            await this.renderFile(entry);
          }
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
   * Use Stylelint to check for errors within the defined entry file.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  lintFile(entry) {
    return new Promise(cb => {
      if (!this.config.THEME_DEVMODE) {
        return cb();
      }

      const source = readFileSync(entry);

      return postcss(this.postcssConfig)
        .process(source, {
          from: entry,
          syntax: postcssScss,
        })
        .then(result => {
          this.stylelintError = result.stylelint ? result.stylelint.stylelintError || false : false;

          if (this.stylelintError) {
            Logger.warning(`Stylelint encountered some problems:`);
          }

          if (result.messages) {
            result.messages.forEach(message => {
              if (message.text) {
                Logger[message.type || 'info'](
                  `- ${message.text} | ${entry}:${message.line}:${message.column}`
                );
              }
            });
          }

          cb();
        });
    });
  }

  /**
   * Compile the given entry Sass file and prepare it for the Filesystem.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  renderFile(entry) {
    return new Promise(cb => {
      if (this.stylelintError) {
        Logger.info(`Ignoring file due to Stylelint errors: ${entry}`);
        cb();
      } else {
        const destination = entry
          .replace(this.config.THEME_SRC, this.config.THEME_DIST)
          .replace('.scss', '.css');

        Logger.info(`Compiling: ${entry}`);

        render(
          {
            file: entry,
            outputStyle: 'compact',
            importer: globImporter(),
            includePaths: [this.config.THEME_SRC],
            sourceMap: this.config.THEME_DEVMODE,
            outFile: destination,
          },
          async (error, result) => {
            if (error) {
              Logger.error(
                `Error at line: ${error.line}, column: ${error.column}. - ${error.file}`,
                true
              );
              Logger.error(error.message, true);
            } else {
              await this.writeFile(result, destination);
            }

            cb();
          }
        );
      }
    });
  }

  /**
   * Create the destination directory before writing the source to
   * the filesystem.
   */
  writeFile(result, destination) {
    return new Promise(cb => {
      mkdirp(dirname(destination)).then((dirPath, error) => {
        if (error) {
          Logger.error(error);
        } else {
          // Write the actual css to the filesystem.
          writeFileSync(destination, result.css.toString());

          // Also write the map file if the development environment is active.
          if (this.config.THEME_DEVMODE) {
            writeFileSync(`${destination}.map`, result.map.toString());
          }

          Logger.success(`Done compiling: ${destination}`);
        }

        cb();
      });
    });
  }
}

module.exports = SassCompiler;
