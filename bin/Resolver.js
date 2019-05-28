const { existsSync, createReadStream, createWriteStream } = require('fs');
const { basename, dirname, join, resolve } = require('path');
const { error, warning, success } = require('./common/Logger');
const ConfigManager = require('./common/ConfigManager');
const mkdirp = require('mkdirp')

class Resolver {
  init(config) {
    const vendors = ConfigManager.load('resolve');

    // Throw an exception if vendors is not a valid Object.
    if (!vendors || !(vendors instanceof Object) || Array.isArray(vendors)) {
      error(`The 'resolve' key must be a valid Object.`);
    }

    /**
     * Keep track of the amount of modules to resolve in order to call the
     * actual callback.
     */
    this.entries = Object.keys(vendors).length;

    /**
     * Create a new queue in order to keep track if all modules has been
     * resolved.
     */
    this.queue = 0;

    /**
     * Resolve each module within a global Promise in order to initiate the
     * callback after all modules has been resolved.
     */
    return new Promise((cb, reject) => {
      Object.keys(vendors).forEach(name => {
        const vendor = vendors[name];
        const cwd = dirname((require.resolve(`${name}/package.json`)));
        const path = join(cwd, vendor);

        /**
         * Decrease the entries values since the current dependency doesn't
         * exists.
         */
        if (!existsSync(path)) {
          warning(`Unable to find ${vendor} from vendor: ${name}. Skipping dependency...`);

          this.entries -= 1;

          return;
        }

        // Define the destination path for the current module.
        const dest = resolve(config.THEME_DIST, 'main/vendors/', name, basename(path));

        mkdirp(dirname(dest), err => {
          if (err) {
            error(err);
          }

          // Stream the actual contents in order to resolve each module faster.
          createReadStream(path).pipe(
            createWriteStream(dest).on('close', () => {
              success(`'${name}' has been resolved successfully!`);

              this.queue += 1;

              if (this.queue === this.entries) {
                cb();
              }
            })
          );
        });
      });
    });
  }
}

module.exports = Resolver;
