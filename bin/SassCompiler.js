const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');
const { render } = require('node-sass');
const globImporter = require('node-sass-glob-importer');

const Logger = require('./common/Logger');

class SassCompiler {
  init(config) {
    return new Promise(cb => {
      this.config = config;

      this.cwd = {
        main: sync(`${this.config.THEME_SRC}/main/stylesheets/*.scss`),
        modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.scss`),
      };

      const baseDirectories = Object.keys(this.cwd);

      let queue = 0;

      baseDirectories.forEach(async directory => {
        const cwd = this.cwd[directory];

        if (cwd.length === 0) {
          Logger.warning(
            `Cannot find any stylesheets witin ${join(this.config.THEME_SRC, directory)}`
          );
        } else {
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
        if (!statSync(entry).size) {
          Logger.warning(`Skipping empty file: ${entry}`);
        } else {
          await this.renderFile(entry);
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
   * Compile the given entry Sass file and prepare it for the Filesystem.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  renderFile(entry) {
    return new Promise(cb => {
      const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);

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
            // Use console.log in favor of message() since nodemon only accepts the log method.
            // eslint-disable-next-line no-console
            console.log(
              `Error at line: ${error.line}, column: ${error.column}.`,
              error.message,
              error.file
            );
          }

          await this.writeFile(result, destination);

          cb();
        }
      );
    });
  }

  /**
   * Create the destination directory before writing the source to
   * the filesystem.
   */
  writeFile(result, destination) {
    return new Promise(cb => {
      mkdirp(dirname(destination), error => {
        if (error) {
          Logger.error(error);
        }

        // Write the actual css to the filesystem.
        writeFileSync(destination.replace('.scss', '.css'), result.css.toString());

        // Also write the map file if the development environment is active.
        if (this.config.THEME_DEVMODE) {
          writeFileSync(destination.replace('.scss', '.css.map'), result.map.toString());
        }

        Logger.success(`Done compiling: ${destination.replace('.scss', '.css')}`);

        cb();
      });
    });
  }
}

module.exports = SassCompiler;
