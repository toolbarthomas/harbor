const ConfigManager = require('../common/ConfigManager');

class BaseService {
  constructor(config) {
    this.name = this.constructor.name;

    this.config = ConfigManager.load(this.name);
  }
}

module.exports = BaseService;
