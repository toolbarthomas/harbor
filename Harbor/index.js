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
const TaskManager = require('./tooling/TaskManager');
const Watcher = require('./tooling/Watcher');

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();

    const environment = new Environment();
    this.env = environment.define();

    this.Console = new Logger(this.env);

    this.tooling = {
      TaskManager: new TaskManager(),
    };

    this.services = {
      Cleaner: new Cleaner(this.tooling),
      FileSync: new FileSync(this.tooling),
      JsCompiler: new JsCompiler(this.tooling),
      Resolver: new Resolver(this.tooling),
      SassCompiler: new SassCompiler(this.tooling),
      Server: new Server(this.tooling),
      StyleguideCompiler: new StyleguideCompiler(this.tooling),
      StyleOptimizer: new StyleOptimizer(this.tooling),
      SvgSpriteCompiler: new SvgSpriteCompiler(this.tooling),
    };
  }

  /**
   * Init Harbor and run tasks specified from the Command Line Arguments.
   */
  async init() {
    const { task } = this.Argv.args;

    const Watch = new Watcher(this.tooling.TaskManager);

    Watch.spawn(task);

    await this.tooling.TaskManager.publish(task);

    // if (queue.includes('watch') && this.env.THEME_DEVMODE) {
    //   this.Watcher = new Watcher(this.services);

    //   this.watch();
    // }

    // const completed = [];

    // await Promise.all(
    //   jobs.map(
    //     (name) =>
    //       new Promise(async (cb) => {
    //         if (typeof this[name] === 'function') {
    //           this.Console.info(`Starting: ${name}`);

    //           await this[name]();

    //           completed.push(name);

    //           this.Console.info(`Finished: ${name}`);
    //         } else {
    //           this.Console.error(`Task '${name}' does not exists.`);
    //         }

    //         cb();
    //       })
    //   )
    // );

    // if (jobs.length) {
    //   this.Console.success(`Completed ${completed.length} tasks`);
    // }
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
  clean() {
    this.services.Cleaner.init(this.Console);
  }

  /**
   * Harbor tasks for syncing the defined files to the THEME_DIST directory.
   * Additional directories can be defined within the optional environment file
   * by asigning paths to the THEME_STATIC_DIRECTORIES variable.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  sync() {
    this.services.FileSync.init(this.Console);
  }

  /**
   * Resolves the configured directories to the build directory, should be used
   * on entries that are excluded from the defined source directory.
   *
   * @param {Object} config The Harbor environment configuration object.
   */
  async resolve() {
    await this.services.Resolver.init(this.Console);
  }

  /**
   * Compiles a standalone development styleguide.
   */
  styleguide() {
    return this.services.StyleguideCompiler.init(this.Console);
  }

  styleguideSetup() {
    return this.services.StyleguideCompiler.setup(this.env);
  }

  /**
   * Harbor task to generate the source stylesheets (optional support for sass).
   */
  async stylesheets() {
    await this.services.SassCompiler.init(this.Console);
    await this.services.StyleOptimizer.init(this.Console);
  }

  watch() {
    return this.Watcher.spawn(this.Console);
  }

  /**
   * Harbor task to transpile the source javascripts.
   */
  async javascripts() {
    await this.services.JsCompiler.init(this.Console);
  }

  /**
   * Harbor task to transform the source images like sprites.
   */
  async images() {
    await this.services.SvgSpriteCompiler.init(this.Console);
  }

  /**
   * Starts the Browsersync development server.
   */
  serve() {
    this.services.Server.init(this.Console);
  }
}

module.exports = Harbor;
