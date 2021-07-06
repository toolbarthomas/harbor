import concat from 'concat';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import { minify } from 'uglify-js';

import Plugin from './Plugin.js';

/**
 * Minifies the defined js entries within the THEME_DIST directory
 */
class JsOptimizer extends Plugin {
  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    if (this.config.options && this.config.options.bundle) {
      await Promise.all(
        this.entry.map((name, index) => new Promise((cb) => this.bundleCwd(name, index).then(cb)))
      );
    }

    await Promise.all(
      this.entry.map((name) => new Promise((cb) => this.optimizeCwd(name).then(cb)))
    );

    return super.resolve();
  }

  /**
   * Optimizes the sources from the defined entry glob.
   */
  async optimizeCwd(cwd) {
    await Promise.all(
      cwd.map(
        (p) =>
          new Promise((done) => {
            this.Console.log(`Optimizing: ${p}`);

            fs.readFile(p, (exception, data) => {
              if (exception) {
                return this.Console.error(exception);
              }

              if (!data) {
                return super.resolve();
              }

              const result = minify(data.toString(), this.config.options.minify || {});

              if (!result.code || result.error) {
                if (result.error) {
                  this.Console.error(`Minify exception encountered for ${p}: ${result.error}`);
                  this.Console.info(`The original state for ${p} will be used instead.`);
                }
              }

              return this.write(p, result.error ? data.toString() : result.code)
                .then(done)
                .catch((e) => {
                  this.Console.error(e);

                  super.reject();
                });
            });
          })
      )
    );
  }

  /**
   * Optimizes the sources from the defined entry glob.
   */
  async bundleCwd(cwd, index) {
    return concat(cwd).then((result) => {
      let base = cwd.map((p) => p.split(path.sep));
      base = base.map((b) => b.filter((bb) => base[0].includes(bb)));

      const bundle = path.resolve(
        path.join(
          base.sort((a, b) => a.length - b.length)[0].join(path.sep),
          `${Object.keys(this.config.entry)[index]}.bundle${path.extname(cwd[0])}`
        )
      );

      this.Console.log(`Writing bundle: ${bundle}`);

      mkdirp.sync(path.dirname(bundle));
      fs.writeFileSync(bundle, result);
    });
  }

  /**
   * Writes the optimized file to the filesystem.
   */
  write(p, blob) {
    if (!p) {
      this.Console.error(`Unable to optimize script, no path has been defined.`);

      return super.reject();
    }

    if (!blob) {
      this.Console.error(`Unable to optimize script, no data has been defined for ${p}.`);

      return super.reject();
    }

    return new Promise((cb) => {
      fs.writeFile(p, blob, () => {
        this.Console.log(`File optimized: ${p}`);

        cb();
      });
    });
  }
}

export default JsOptimizer;
