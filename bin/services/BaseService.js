const ConfigManager = require('../common/ConfigManager');

const Logger = require('../common/Logger');

class BaseService {
  constructor(config) {
    this.name = this.constructor.name;

    this.config = ConfigManager.load(this.name);

    this.Console = new Logger(this.name);
  }
}

module.exports = BaseService;
