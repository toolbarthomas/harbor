const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');
const { render } = require('node-sass');
const globImporter = require('node-sass-glob-importer');

const Logger = require('./common/Logger');

class SassCompiler {
  init(config) {
    this.config = config;

    this.cwd = {
      main: sync(`${this.config.THEME_SRC}/main/stylesheets/*.scss`),
      modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.scss`),
    };

    Object.keys(this.cwd).forEach(async directory => {
      if (this.cwd[directory].length === 0) {
        Logger.info(`Cannot find any stylesheet witin ${join(this.config.THEME_SRC, directory)}`);
      } else {
        await this.renderCwd(directory);
      }
    });
  }

  /**
   * Compiles each entry Sass file within the defined baseDirectory.
   *
   * @param {String} directory Key name of the defined cwd Array.

   */
  renderCwd(directory) {
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
          await this.render(entry);

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

  render(entry) {
    const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);

    Logger.info(`Compiling: ${entry}`);

    return new Promise(cb => {
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

        Logger.success(`Successfully compiled: ${destination.replace('.scss', '.css')}`);

        cb();
      });
    });
  }
}

module.exports = SassCompiler;
