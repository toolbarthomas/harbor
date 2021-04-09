const chokidar = require('chokidar');
const { extname, join } = require('path');

const BaseService = require('./BaseService');
const ConfigManager = require('../common/ConfigManager');
const { pathToFileURL } = require('url');

class Watcher extends BaseService {
  constructor() {
    super();

    this.instances = {};
  }

  init(environment) {
    this.environment = environment;

    const config = ConfigManager.load();
    const entries = Object.keys(config)
      .map((key) => {
        if (key === this.name) {
          return;
        }

        return config[key].entry;
      })
      .filter((e) => e);

    entries.forEach((service) => {
      const sources = Object.values(service).map((source) =>
        join(this.environment.THEME_SRC, source)
      );

      console.log(sources);
    });
  }
}

module.exports = Watcher;
