const { transform } = require('@babel/core');
const { statSync, readFileSync, writeFileSync } = require('fs');
const { Linter, SourceCode } = require('eslint');
const { sync } = require('glob');
const mkdirp = require('mkdirp');
const { dirname, join, resolve } = require('path');

const BaseService = require('./BaseService');

class JsCompiler extends BaseService {
  constructor() {
    super();

    this.linter = new Linter();
  }

  async init(environment) {
    super.init(environment);

    this.environment = environment;

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
            const cwd = sync(join(this.environment.THEME_SRC, this.config.entry[name]));

            this.transpileCwd(cwd).then(() => {
              cb();
            });
          })
      )
    );
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
              if (!statSync(entry).size) {
                this.Console.warning(`Skipping empty file: ${entry}`);
              } else {
                this.Console.log(`Transpiling: ${entry}`);

                const source = readFileSync(entry);

                if (this.config.plugins.eslint) {
                  const linter = this.linter.verify(source.toString(), this.config.plugins.eslint);
                  if (Array.isArray(linter)) {
                    linter.forEach((f) => {
                      if (f.fatal) {
                        const m = [
                          `Unable to compile: ${resolve(entry)}:${f.line}:${f.column}`,
                          `'${f.message}`,
                        ];

                        if (this.environment.THEME_DEVMODE) {
                          this.Console.warning(m);
                          return cb();
                        }

                        this.Console.error(m);
                      }
                    });
                  }
                }

                const transpiledSource = transform(source, this.config.plugins.transform);
                const destination = resolve(entry).replace(
                  resolve(this.environment.THEME_SRC),
                  resolve(this.environment.THEME_DIST)
                );

                /**
                 * Create the destination directory before writing the source to
                 * the filesystem.
                 */
                mkdirp(dirname(destination)).then((dirPath, error) => {
                  if (error) {
                    this.Console.error(error);
                  }

                  writeFileSync(destination, transpiledSource.code);

                  this.Console.log(`Successfully transpiled: ${destination}`);

                  cb();
                });
              }
            })
        )
      ).then(() => done());
    });
  }
}

module.exports = JsCompiler;
