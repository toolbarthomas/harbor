const Argv = require('./common/Argv');
const Environment = require('./common/Environment');
const Logger = require('./common/Logger');

const Cleaner = require('./services/Cleaner');
const FileSync = require('./services/FileSync');
const JsCompiler = require('./services/JsCompiler');
const Resolver = require('./services/Resolver');
const SassCompiler = require('./services/SassCompiler');
const Server = require('./services/Server');
const StyleOptimizer = require('./services/StyleOptimizer');
const SvgSpriteCompiler = require('./services/SvgSpriteCompiler');

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();
    this.Cleaner = new Cleaner();
    this.Environment = new Environment();
    this.FileSync = new FileSync();
    this.JsCompiler = new JsCompiler();
    this.Resolver = new Resolver();
    this.SassCompiler = new SassCompiler();
    this.Server = new Server();
    this.StyleOptimizer = new StyleOptimizer();
    this.SvgSpriteCompiler = new SvgSpriteCompiler();
  }

  /**
   * Init Harbor and run tasks specified from the Command Line Arguments.
   */
  init() {
    const { task } = this.Argv.args;

    if (!task) {
      Logger.error('No task has been defined.');
    }

    const queue = task.split(',').map((t) => {
      return t.trim();
    });

    const environment = this.Environment.define();

    // Run all defined tasks in a Synchronous order.
    queue.forEach(async (name) => {
      if (typeof this[name] === 'function') {
        Logger.info(`Running task: ${name}`);

        await this[name](environment);

        Logger.success(`Done - ${name}`);
      } else {
        Logger.error(`Task '${name}' does not exists.`);
      }
    });
  }

  /**
   * Harbor tasks for cleaning up the THEME_DIST directory.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  clean(environment) {
    this.Cleaner.init(environment);
  }

  /**
   * Harbor tasks for syncing the defined files to the THEME_DIST directory.
   * Additional directories can be defined within the optional environment file
   * by asigning paths to the THEME_STATIC_DIRECTORIES variable.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  sync(environment) {
    this.FileSync.init(environment);
  }

  /**
   * Harbor tasks for resolving specific dependencies that are not defined within
   * the src directory.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  async resolve(environment) {
    await this.Resolver.init(environment);
  }

  /**
   * Harbor task to generate the source stylesheets (optional support for sass).
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  async stylesheets(environment) {
    await this.SassCompiler.init(environment);
    await this.StyleOptimizer.init(environment);
  }

  /**
   * Harbor task to transpile the source javascripts.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  async javascripts(environment) {
    await this.JsCompiler.init(environment);
  }

  /**
   * Harbor task to transform the source images like sprites.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  async images(environment) {
    await this.SvgSpriteCompiler.init(environment);
  }

  /**
   * Starts the Browsersync development server.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  serve(environment) {
    this.Server.init(environment);
  }
}

module.exports = new Harbor();
