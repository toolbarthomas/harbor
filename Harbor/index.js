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
  }

  /**
   * Returns the Harbor environment configuration.
   *
   * @returns the defined Harbor environment configuration.
   */
  getEnvironment() {
    return this.env ? this.env : this.Environment.define();
  }

  styleguideSetup() {
    return this.services.StyleguideCompiler.setup(this.env);
  }
}

module.exports = Harbor;
