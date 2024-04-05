import { transformFileAsync } from '@babel/core';
import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';

import { Worker } from './Worker.js';

/**
 * Compiles the configured entries with Babel.
 */
export class JsCompiler extends Worker {
  constructor(services, options) {
    super(services, options);

    /**
     * Keeps track of the entries that cannot be transpiled.
     */
    this.transpileExceptions = [];

    /**
     * Keeps track of the entries that are not valid according to the linter.
     */
    this.linterExceptions = [];
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    const queue = this.entry.map(
      (entry) =>
        new Promise((done) => {
          this.transpileCwd(entry, done);
        })
    );

    await Promise.all(queue);

    const { length } = this.transpileExceptions;

    if (length) {
      this.Console.error(`JsCompiler encountered ${length} error${length !== 1 ? 's' : ''}...`);

      this.transpileExceptions = [];

      this.linterExceptions = [];

      return super.reject();
    }

    return super.resolve();
  }

  /**
   * Transpile the javascript files defined within the given baseDirectory.
   *
   * @param {Array} cwd Array of javascript files to process.
   */
  async transpileCwd(cwd, done) {
    await Promise.all(
      cwd.map(
        (entry) =>
          new Promise((cb) => {
            transformFileAsync(entry, {
              sourceMaps: true,
              ...this.config.plugins.transform,
            })
              .then((result) => {
                const { code, map } = result;

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

                return mkdirp(path.dirname(destination)).then((dirPath, dirException) => {
                  if (dirException) {
                    this.Console.error(dirException);

                    return super.reject();
                  }

                  return fs.writeFile(destination, code, (fileException) => {
                    if (fileException) {
                      this.Console.error(fileException);

                      return super.reject();
                    }

                    if (this.parseEnvironmentProperty('THEME_DEBUG') && map) {
                      fs.writeFileSync(`${destination}.map`, JSON.stringify(map));
                    }

                    this.Console.log(`Successfully transpiled: ${destination}`);

                    return cb();
                  });
                });
              })
              .catch((exception) => {
                if (exception) {
                  this.Console.error(exception);

                  this.transpileExceptions.push(exception);

                  cb();
                }
              });
          })
      )
    );

    done();
  }
}
