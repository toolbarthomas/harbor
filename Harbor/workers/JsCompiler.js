import { Linter, SourceCode } from 'eslint';
import { transformFileAsync, transformFromAstSync } from '@babel/core';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

import Worker from './Worker.js';

/**
 * Compiles the configured entries with Babel.
 */
export default class JsCompiler extends Worker {
  constructor(services, options) {
    super(services, options);

    this.linter = new Linter();
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
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
              transformFileAsync(
                entry,
                Object.assign(
                  {
                    ast: true,
                    code: false,
                  },
                  this.config.plugins.transform
                )
              ).then((result) => {
                const { code, map } = transformFromAstSync(result.ast, fs.readFileSync(entry));

                if (!code) {
                  this.Console.info(`Skipping empty entry: ${entry}`);
                  return cb();
                }

                const destination = path
                  .resolve(entry)
                  .replace(
                    path.resolve(this.environment.THEME_SRC),
                    path.resolve(this.environment.THEME_DIST)
                  );

                if (this.config.plugins.eslint) {
                  const linter = this.linter.verify(code, this.config.plugins.eslint, {
                    filename: destination,
                  });

                  if (Array.isArray(linter)) {
                    linter.forEach((f) => {
                      if (f.fatal) {
                        const m = [
                          `Unable to compile: ${path.resolve(destination)}:${f.line}:${f.column}`,
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
                mkdirp(path.dirname(destination)).then((dirPath, error) => {
                  if (error) {
                    this.Console.error(error);
                  }

                  fs.writeFileSync(destination, code);

                  if (this.environment.THEME_DEBUG && map) {
                    fs.writeFileSync(`${destination}.map`, map);
                  }

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
