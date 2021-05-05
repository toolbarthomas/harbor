const { transformFileAsync } = require('@babel/core');
const { statSync, readFileSync, writeFileSync } = require('fs');
const { Linter, SourceCode } = require('eslint');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname, join, resolve } = require('path');

const BaseService = require('./BaseService');

/**
 * Compiles the configured entries with Babel.
 */
class JsCompiler extends BaseService {
  constructor(tooling, options) {
    super(tooling, options);

    this.linter = new Linter();
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    super.init();

    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    await Promise.all(
      this.entry.map(
        (entry) =>
          new Promise((cb) => {
            if (entry.length) {
              this.transpileCwd(entry).then(cb);
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
   * Transpile the javascript files defined within the given baseDirectory.
   *
   * @param {Array} cwd Array of javascript files to process.
   */
  transpileCwd(cwd) {
    return new Promise(async (done) => {
      Promise.all(
        cwd.map(
          (entry) =>
            new Promise((cb) => {
              transformFileAsync(entry, this.config.plugins.transform).then((result) => {
                if (!result.code) {
                  this.Console.info(`Skipping empty entry: ${entry}`);
                  return cb();
                }

                const destination = resolve(entry).replace(
                  resolve(this.environment.THEME_SRC),
                  resolve(this.environment.THEME_DIST)
                );

                if (this.config.plugins.eslint) {
                  const linter = this.linter.verify(result.code, this.config.plugins.eslint, {
                    filename: destination,
                  });

                  if (Array.isArray(linter)) {
                    linter.forEach((f) => {
                      if (f.fatal) {
                        const m = [
                          `Unable to compile: ${resolve(destination)}:${f.line}:${f.column}`,
                          `'${f.message}`,
                        ];

                        if (this.environment.THEME_DEBUG) {
                          this.Console.warning(m);
                          return cb();
                        }

                        this.Console.error(m);

                        process.exit(1);
                      }
                    });
                  }
                }

                /**
                 * Create the destination directory before writing the source to
                 * the filesystem.
                 */
                mkdirp(dirname(destination)).then((dirPath, error) => {
                  if (error) {
                    this.Console.error(error);
                  }

                  writeFileSync(destination, result.code);

                  this.Console.log(`Successfully transpiled: ${destination}`);

                  cb();
                });
              });
            })
        )
      ).then(done);
    });
  }
}

module.exports = JsCompiler;
