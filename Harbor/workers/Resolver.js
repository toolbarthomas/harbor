import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { createRequire } from 'module';

import Worker from './Worker.js';

/**
 * Resolves the configured Resolver entries to the environment destination
 * directory.
 */
export default class Resolver extends Worker {
  constructor(services) {
    super(services);
  }

  /**
   * Resolves the configured Resolver entries.
   */
  async init() {
    if (!this.config.entry || !this.config.entry instanceof Object) {
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
              const vendor = this.config.entry[name];
              const require = createRequire(import.meta.url);

              const cwd = path.dirname(require.resolve(`${name}/package.json`));
              const p = path.join(cwd, vendor);

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
                  this.Console.success(`Package resolved: ${name}`);

                  done();
                })
              );
            } catch (exception) {
              this.Console.error(`Unable to resolve package: ${name}`, exception);

              this.reject();
            }
          })
      )
    );

    super.resolve();
  }
}
