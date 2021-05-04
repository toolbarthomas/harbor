const { existsSync, createReadStream, createWriteStream } = require('fs');
const mkdirp = require('mkdirp');
const { basename, dirname, join, resolve } = require('path');

const BaseService = require('./BaseService');

/**
 * Resolves the configured Resolver entries to the environment destination
 * directory.
 */
class Resolver extends BaseService {
  constructor(tooling) {
    super(tooling);
  }

  /**
   * Resolves the configured Resolver entries.
   *
   * @param {Object} tooling the inherited instance tools.
   */
  async init() {
    super.init();

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
              const cwd = dirname(require.resolve(`${name}/package.json`));
              const path = join(cwd, vendor);

              if (!existsSync(path)) {
                this.Console.warning(
                  `Unable to find ${vendor} from vendor: ${name}. Skipping dependency...`
                );
                done();
              }

              // Define the destination path for the current module.
              const dest = resolve(
                this.environment.THEME_DIST,
                this.config.cwd || 'vendors',
                name,
                basename(path)
              );

              mkdirp.sync(dirname(dest));

              // Stream the actual contents in order to resolve each module faster.
              createReadStream(path).pipe(
                createWriteStream(dest).on('close', () => {
                  this.Console.success(`'${name}' has been resolved successfully!`);

                  done();
                })
              );
            } catch (exception) {
              throw new Error(exception);
            }
          })
      )
    );

    super.resolve();
  }
}

module.exports = Resolver;
