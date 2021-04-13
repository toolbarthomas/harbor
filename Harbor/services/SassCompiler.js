const { statSync, readFileSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const { basename, dirname, join, resolve } = require('path');
const mkdirp = require('mkdirp');
const { render } = require('node-sass');
const globImporter = require('node-sass-glob-importer');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');
const stylelint = require('stylelint');

const ConfigManager = require('../common/ConfigManager');
const BaseService = require('./BaseService');

/**
 * Compiles the configured entries with Node Sass.
 */
class SassCompiler extends BaseService {
  constructor(tooling) {
    super(tooling);

    /**
     * Flag to prevent files from being written to the Filesystem if the given
     * file has any Stylelint errors.
     */
    this.stylelintExceptions = [];

    /**
     * Flag to prevent files from being written to the Filesystem if the given
     * file has any Sass errors.
     */
    this.sassExceptions = [];
  }

  /**
   * Compiles the configured Sass entries.
   *
   * @param {Object} tooling the inherited instance tools.
   */
  async init() {
    super.init();

    if (!this.config.entry instanceof Object) {
      return;
    }

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return;
    }

    await Promise.all(
      entries.map(
        (name) =>
          new Promise((cb) => {
            const cwd = sync(join(this.environment.THEME_SRC, this.config.entry[name])).filter(
              (entry) => basename(entry)[0] !== '_'
            );

            this.renderCwd(cwd).then(() => {
              cb();
            });
          })
      )
    );

    if (!this.environment.THEME_DEVMODE) {
      if (this.stylelintExceptions.length || this.sassExceptions.length) {
        this.Console.error(
          `Sasscompiler encountered ${
            this.stylelintExceptions.length + this.sassExceptions.length
          } errors...`
        );
      }
    }

    super.resolve();
  }

  /**
   * Compiles each entry Sass file within the defined cwd asynchronously.
   *
   * @param {Array} cwd The actual array to process.
   */
  renderCwd(cwd) {
    return new Promise((done) => {
      Promise.all(
        cwd.map(
          (entry) =>
            new Promise(async (cb) => {
              if (String(basename(entry)).indexOf('_') !== 0) {
                if (!statSync(entry).size) {
                  this.Console.warning(`Skipping empty file: ${entry}`);
                } else {
                  await this.lintFile(entry);
                  await this.renderFile(entry);
                }
              }

              cb();
            })
        )
      ).then(() => done());
    });
  }

  /**
   * Use Stylelint to check for errors within the defined entry file.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  lintFile(entry) {
    return new Promise((cb) => {
      if (!this.environment.THEME_DEVMODE) {
        return cb();
      }

      const source = readFileSync(entry);

      return postcss(this.config.plugins.postcss.plugins || [])
        .process(source, {
          from: entry,
          syntax: postcssScss,
        })
        .then((result) => {
          this.stylelintExceptions = result.stylelint
            ? result.stylelint.stylelintError || false
            : false;

          if (this.stylelintExceptions) {
            this.Console.warning(`Stylelint encountered some problems:`);

            if (result.messages) {
              result.messages.forEach((message) => {
                if (message.text) {
                  this.Console[message.type || 'info'](
                    `- ${message.text} | ${entry}:${message.line}:${message.column}`
                  );
                }
              });
            }
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
    return new Promise((cb) => {
      if (this.stylelintExceptions.length) {
        this.Console.info(`Ignoring file due to Stylelint errors: ${entry}`);
        cb();
      } else {
        const destination = resolve(entry)
          .replace(resolve(this.environment.THEME_SRC), resolve(this.environment.THEME_DIST))
          .replace('.scss', '.css');

        this.Console.log(`Compiling: ${entry}`);

        render(
          Object.assign(this.config.options, {
            file: entry,
            includePaths: [this.environment.THEME_SRC],
            sourceMap: this.environment.THEME_DEVMODE,
            importer: globImporter(),
            outFile: destination,
          }),
          async (error, result) => {
            if (error) {
              this.Console.error(
                [
                  `Sass error encountered: ${error.file}:${error.line}:${error.column}`,
                  error.message,
                ],
                true
              );

              this.sassExceptions.push(error);
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
    return new Promise((cb) => {
      mkdirp(dirname(destination)).then((dirPath, error) => {
        if (error) {
          this.Console.error(error);
        } else {
          // Write the actual css to the filesystem.
          writeFileSync(destination, result.css.toString());

          // Also write the map file if the development environment is active.
          if (this.environment.THEME_DEVMODE) {
            writeFileSync(`${destination}.map`, result.map.toString());
          }

          this.Console.log(`Done compiling: ${destination}`);
        }

        cb();
      });
    });
  }
}

module.exports = SassCompiler;
