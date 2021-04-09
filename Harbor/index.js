const Argv = require('./common/Argv');
const Environment = require('./common/Environment');
const Logger = require('./common/Logger');

const Cleaner = require('./services/Cleaner');
const FileSync = require('./services/FileSync');
const JsCompiler = require('./services/JsCompiler');
const Resolver = require('./services/Resolver');
const SassCompiler = require('./services/SassCompiler');
const Server = require('./services/Server');
const StyleguideCompiler = require('./services/StyleguideCompiler');
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
    this.StyleguideCompiler = new StyleguideCompiler();
    this.StyleOptimizer = new StyleOptimizer();
    this.SvgSpriteCompiler = new SvgSpriteCompiler();

    this.env = this.Environment.define();
  }

  /**
   * Init Harbor and run tasks specified from the Command Line Arguments.
   */
  async init() {
    const { task } = this.Argv.args;
    const Console = new Logger(this.constructor.name);

    if (!task) {
      Console.error('No task has been defined.');
    }

    const queue = task.split(',').map((t) => {
      return t.trim();
    });

    if (!queue.length) {
      return;
    }

    const completed = [];

    await Promise.all(
      queue.map(
        (name) =>
          new Promise(async (cb) => {
            if (typeof this[name] === 'function') {
              Console.info(`Starting: ${name}`);

              await this[name](this.env);

              completed.push(name);

              Console.info(`Finished: ${name}`);
            } else {
              Console.error(`Task '${name}' does not exists.`);
            }

            cb();
          })
      )
    );

    Console.success(`Completed ${completed.length} tasks`);
  }

  /**
   * Returns the Harbor environment configuration.
   *
   * @returns the defined Harbor environment configuration.
   */
  getEnvironment() {
    return this.env ? this.env : this.Environment.define();
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
   * Resolves the configured directories to the build directory, should be used
   * on entries that are excluded from the defined source directory.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  async resolve(environment) {
    await this.Resolver.init(environment);
  }

  /**
   * Compiles a standalone development styleguide.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  styleguide(environment) {
    return this.StyleguideCompiler.init(environment);
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

module.exports = Harbor;
