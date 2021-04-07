const rimraf = require('rimraf');
const { existsSync } = require('fs');
const { resolve } = require('path');

const Logger = require('../common/Logger');
const BaseService = require('./BaseService');

/**
 * Clears the `THEME_DIST` directory.
 */
class Cleaner extends BaseService {
  constructor() {
    super();
  }

  init(environment) {
    if (environment) {
      this.path = resolve(environment.THEME_DIST);

      if (existsSync(this.path)) {
        Logger.info(`Clearing directory: ${this.path}`);

        rimraf(this.path, () => {
          Logger.success(`Cleared directory: ${this.path}`);
        });
      } else {
        Logger.warning(`${this.path} does not exist and will not be cleared.`);
      }
    }
  }
}

module.exports = Cleaner;
