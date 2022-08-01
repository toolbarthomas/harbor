import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { createRequire } from 'module';

import { Worker } from './Worker.js';

/**
 * Resolves the configured Resolver entries to the environment destination
 * directory.
 */
export class Resolver extends Worker {
  /**
   * Resolves the configured Resolver entries.
   */
  async init() {
    if (!this.config.entry || !(this.config.entry instanceof Object)) {
      return super.resolve();
    }

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return super.resolve();
    }

    await Promise.all(
      entries.map(
        (name) =>
          new Promise((done) => {
            try {
              let vendor = Array.isArray(this.config.entry[name])
                ? this.config.entry[name]
                : [this.config.entry[name]];
              vendor = vendor.filter((v) => v);

              const require = createRequire(import.meta.url);

              if (vendor.length) {
                let queue = 0;

                vendor.forEach((v) => {
                  const cwd = path.dirname(
                    require.resolve(`${name}${path.extname(name) ? '' : '/package.json'}`)
                  );
                  const p = path.join(cwd, v);

                  if (!fs.existsSync(p)) {
                    this.Console.warning(
                      `Unable to resolve package: ${name}`,
                      `Package does not exist ${p}`
                    );

                    done();
                  }

                  // Define the destination path for the current module.
                  const dest = path.resolve(
                    this.environment.THEME_DIST,
                    this.config.cwd || 'vendors',
                    name,
                    path.basename(p)
                  );

                  mkdirp.sync(path.dirname(dest));

                  // Stream the actual contents in order to resolve each module faster.
                  fs.createReadStream(p).pipe(
                    fs.createWriteStream(dest).on('close', () => {
                      this.Console.log(`Source resolved: ${p}`);

                      queue += 1;

                      if (queue >= vendor.length) {
                        this.Console.log(`Package resolved: ${name}`);

                        done();
                      }
                    })
                  );
                });
              } else {
                done();
              }
            } catch (exception) {
              this.Console.error(`Unable to resolve package: ${name}`, exception);

              super.reject();
            }
          })
      )
    );

    return super.resolve();
  }
}
