const minify = require('minify');

const Plugin = require('./Plugin');

/**
 * Minifies the defined js entries within the THEME_DIST directory
 */
class JsOptimizer extends Plugin {
  constructor(services, options) {
    super(services, options);
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
      this.entry.map((name) => new Promise((cb) => this.optimizeCwd(name).then((data) => cb())))
    );

    super.resolve();
  }

  async optimizeCwd(cwd) {
    await Promise.all(
      cwd.map(
        (path) =>
          new Promise((done) => {
            this.Console.log(`Optimizing: ${path}`);

            minify(path, this.config.options || {})
              .then((data) =>
                this.optimizeFile(path, data)
                  .then(done)
                  .catch((exception) => {
                    this.Console.error(exception);
                    super.reject();
                  })
              )
              .catch((exception) => {
                this.Console.error(exception);
                super.reject();
              });
          })
      )
    );
  }

  optimizeFile(path, blob) {
    if (!path) {
      this.Console.error(`Unable to optimize script, no path has been defined.`);
      return super.reject();
    }

    if (!blob) {
      this.Console.error(`Unable to optimize script, no data has been defined for ${path}.`);
      return super.reject();
    }

    return new Promise((cb) => {
      writeFile(path, blob, () => {
        this.Console.log(`File optimized: ${path}`);

        cb();
      });
    });
  }
}

module.exports = JsOptimizer;
