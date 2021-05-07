const rimraf = require('rimraf');
const { existsSync } = require('fs');
const { resolve } = require('path');

const Worker = require('./Worker');

/**
 * Clears the defined environment destination directory.
 */
class Cleaner extends Worker {
  constructor(services) {
    super(services);
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    super.init();

    if (this.environment) {
      this.path = resolve(this.environment.THEME_DIST);

      if (existsSync(this.path)) {
        this.Console.info(`Cleaning directory: ${this.path}`);

        rimraf(this.path, () => {
          this.Console.success(`Directory cleaned: ${this.path}`);

          super.resolve();
        });
      } else {
        this.Console.warning(`${this.path} does not exist and will not be cleared.`);

        super.resolve();
      }
    }
  }
}

module.exports = Cleaner;
