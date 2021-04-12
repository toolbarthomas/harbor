const { join } = require('path');
const { sync } = require('glob');

const ConfigManager = require('../common/ConfigManager');

const Logger = require('../common/Logger');

class BaseService {
  constructor(environment, Console) {
    this.name = this.constructor.name;

    this.config = ConfigManager.load(this.name);

    this.environment = environment;
    this.Console = Console;
  }

  init() {
    this.Console.log(`Task ${this.name}:`);
  }
}

module.exports = BaseService;
