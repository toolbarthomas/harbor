const rimraf = require('rimraf');
const { existsSync } = require('fs');
const { resolve } = require('path');

const BaseService = require('./BaseService');

/**
 * Clears the defined environment destination directory.
 */
class Cleaner extends BaseService {
  constructor(tooling) {
    super(tooling);
  }

  /**
   * Clears the environment directory.
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
