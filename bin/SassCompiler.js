const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');
const { renderSync } = require('node-sass');
const globImporter = require('node-sass-glob-importer');

const Logger = require('./common/Logger');

class SassCompiler {
  init(config) {
    this.config = config;

    this.cwd = {
      main: sync(`${this.config.THEME_SRC}/main/stylesheets/*.scss`),
      modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.scss`),
    };

    Object.keys(this.cwd).forEach(directory => {
      const baseDirectory = this.cwd[directory];

      if (baseDirectory.length === 0) {
        Logger.info(`Cannot find any stylesheet witin ${join(this.config.THEME_SRC, directory)}`);
      } else {
        Logger.info(`Compiling stylesheets within: ${join(this.config.THEME_SRC, directory)}`);

        this.compile(baseDirectory);

        Logger.success(`Done compiling within ${join(this.config.THEME_SRC, directory)}`);
      }
    });
  }

  /**
   * Compiles each entry Sass file within the defined baseDirectory.
   *
   * @param {Array} baseDirectory The directory where each entry file
   * should exist in.
   */
  compile(baseDirectory) {
    baseDirectory.forEach(entry => {
      if (!statSync(entry).size) {
        Logger.warning(`Skipping empty file: ${entry}`);
      } else {
        Logger.info(`Compiling: ${entry}`);

        const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);

        const source = renderSync({
          file: entry,
          outputStyle: 'compact',
          importer: globImporter(),
          includePaths: [this.config.THEME_SRC],
          sourceMap: this.config.THEME_DEVMODE,
          outFile: destination,
        });

        /**
         * Create the destination directory before writing the source to
         * the filesystem.
         */
        mkdirp(dirname(destination), error => {
          if (error) {
            Logger.error(error);
          }

          // Write the actual css to the filesystem.
          writeFileSync(destination.replace('.scss', '.css'), source.css.toString());

          // Also write the map file if the development environment is active.
          if (this.config.THEME_DEVMODE) {
            writeFileSync(destination.replace('.scss', '.css.map'), source.map.toString());
          }

          Logger.success(`Successfully compiled: ${destination.replace('.scss', '.css')}`);
        });
      }
    });
  }
}

module.exports = SassCompiler;
