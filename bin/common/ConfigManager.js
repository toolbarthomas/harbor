const { load } = require('module-config-loader');

class ConfigManager {
  static load(option) {
    if (!option) {
      return null;
    }

    /**
     * Check if the defined configuration key has already been defined within
     * the current Node instance in order to prevent the confiuration from
     * loading a second time.
     */
    if (process.env.harbor && process.env.harbor[option]) {
      return process.env.harbor[option];
    }

    const config = load('harbor.config.js');

    if (config instanceof Object && config[option] instanceof Object) {
      /**
       * Cache the actual defined config within the Node process.
       */
      if (process.env.harbor instanceof Object) {
        process.env.harbor[option] = config[option];
      }

      return config[option];
    }

    return {};
  }
}

module.exports = ConfigManager;
