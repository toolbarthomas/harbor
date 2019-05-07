const Argv = require('./Argv');
const Cleaner = require('./Cleaner');
const Environment = require('./Environment');
const FileSync = require('./FileSync');
const JSCompiler = require('./JSCompiler');
const Logger = require('./common/Logger');
const Server = require('./Server');
const SassCompiler = require('./SassCompiler');

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();
    this.Cleaner = new Cleaner();
    this.Environment = new Environment();
    this.FileSync = new FileSync();
    this.JSCompiler = new JSCompiler();
    this.SassCompiler = new SassCompiler();
    this.Server = new Server();
  }

  /**
   * Init Harbor and run tasks specified from the Command Line Arguments.
   */
  init() {
    const { task } = this.Argv.args;

    if (task) {
      const tasks = task.split(',').map(t => {
        return t.trim();
      });

      const { config } = this.Environment;

      // Run all defined tasks in a Synchronous order.
      tasks.forEach(name => {
        if (typeof this[name] === 'function') {
          Logger.info(`Running task: ${name}`);

          this[name](config);
        } else {
          Logger.warning(`Skipping undefined task: ${name}.`);
        }
      });
    }
  }

  /**
   * Harbor tasks for cleaning up the THEME_DIST directory.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  clean(config) {
    this.Cleaner.init(config);
  }

  /**
   * Harbor tasks for syncing the defined files to the THEME_DIST directory.
   * Additional directories can be defined within the optional environment file
   * by asigning paths to the THEME_STATIC_DIRECTORIES variable.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  sync(config) {
    this.FileSync.init(config);
  }

  /**
   * Harbor task to generate the source stylesheets (optional support for sass).
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  stylesheets(config) {
    this.SassCompiler.init(config);
  }

  /**
   * Harbor task to transpile the source javascripts.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  javascripts(config) {
    this.JSCompiler.init(config);
  }

  /**
   * Starts the Browsersync development server.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  serve(config) {
    this.Server.init(config);
  }
}

module.exports = new Harbor();
