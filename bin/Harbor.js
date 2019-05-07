const Argv = require('./Argv');
const Cleaner = require('./Cleaner');
const Environment = require('./Environment');
const Logger = require('./common/Logger');
const Server = require('./Server');
const FileSync = require('./FileSync');

/**
 * Factory setup for Harbor.
 */
class Harbor {
  constructor() {
    this.Argv = new Argv();
    this.Cleaner = new Cleaner();
    this.Environment = new Environment();
    this.FileSync = new FileSync();
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

  clean(config) {
    this.Cleaner.init(config);
  }

  sync(config) {
    this.FileSync.init(config);
  }
}

module.exports = new Harbor();
