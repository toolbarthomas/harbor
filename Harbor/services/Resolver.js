const { existsSync, createReadStream, createWriteStream } = require('fs');
const mkdirp = require('mkdirp');
const { basename, dirname, join, resolve } = require('path');

const BaseService = require('./BaseService');

class Resolver extends BaseService {
  constructor() {
    super();
  }

  async init(environment) {
    super.init(environment);

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
            const vendor = this.config.entry[name];
            const cwd = dirname(require.resolve(`${name}/package.json`));
            const path = join(cwd, vendor);

            /**
             * Decrease the entries values since the current dependency doesn't
             * exists.
             */
            if (!existsSync(path)) {
              this.Console.warning(
                `Unable to find ${vendor} from vendor: ${name}. Skipping dependency...`
              );

              cb();
            }

            // Define the destination path for the current module.
            const dest = resolve(environment.THEME_DIST, 'main/vendors/', name, basename(path));

            mkdirp(dirname(dest)).then((dirPath, error) => {
              if (error) {
                this.Console.error(error);
              }

              // Stream the actual contents in order to resolve each module faster.
              createReadStream(path).pipe(
                createWriteStream(dest).on('close', () => {
                  this.Console.success(`'${name}' has been resolved successfully!`);

                  cb();
                })
              );
            });
          })
      )
    );
  }
}

module.exports = Resolver;
