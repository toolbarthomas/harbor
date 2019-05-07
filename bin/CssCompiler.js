const { existsSync, statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');
const { load } = require('module-config-loader');
const postcss = require('postcss');
const Logger = require('./common/Logger');

class CssCompiler {
  init(config) {
    this.config = config;

    this.cwd = {
      main: sync(`${this.config.THEME_SRC}/main/stylesheets/*.css`),
      modules: sync(`${this.config.THEME_SRC}/modules/*/*/*.css`),
    };

    this.postcssConfig = load('postcss.config.js');

    Object.keys(this.cwd).forEach(async directory => {
      const baseDirectory = this.cwd[directory];

      if (baseDirectory.length === 0) {
        Logger.info(`Cannot find any stylesheet witin ${join(this.config.THEME_SRC, directory)}`);
      } else {
        Logger.info(`Compiling stylesheets within: ${join(this.config.THEME_SRC, directory)}`);

        await this.compile(baseDirectory);

        Logger.success(`Done compiling within ${join(this.config.THEME_SRC, directory)}`);
      }
    });
  }

  /**
   * Compi;es each entry stylesheet within the defined baseDirectory.
   *
   * @param {Array} baseDirectory The directory where each entry file
   * should exist in.
   */
  compile(baseDirectory) {
    let renderQueue = 0;

    return new Promise(cb => {
      baseDirectory.forEach(async entry => {
        if (!statSync(entry).size) {
          Logger.warning(`Skipping empty file: ${entry}`);
        } else {
          await this.process(entry);

          renderQueue += 1;

          if (renderQueue >= baseDirectory.length) {
            cb();
          }
        }
      });
    });
  }

  process(entry) {
    const destination = entry.replace(this.config.THEME_SRC, this.config.THEME_DIST);
    const source = readFileSync(entry);

    Logger.info(`Compiling: ${entry}`);

    return new Promise(cb => {
      postcss(this.postcssConfig.plugins)
        .process(source, {
          from: entry,
        })
        .then(result => {
          result.warnings().forEach(warning => {
            Logger.warning(warning.toString());
          });

          mkdirp(dirname(destination), error => {
            if (error) {
              Logger.error(error);
            }

            // Write the actual css to the filesystem.
            writeFileSync(destination, result.css);

            Logger.success(`Successfully compiled: ${destination}`);

            cb();
          });
        });
    });
  }
}

module.exports = CssCompiler;
