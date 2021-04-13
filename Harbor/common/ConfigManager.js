const { load } = require('module-config-loader');
const { resolve } = require('path');

/**
 * The Configmanager exposes the given Harbor option from the default and
 * custom configuration.
 */
class ConfigManager {
  static load(option) {
    const defaultConfig = load(resolve(__dirname, '../../harbor.default.config.js'));

    // Check if the defined configuration key has already been defined within
    // the current Node instance in order to prevent the confiuration from
    // loading a second time.
    if (option && process.env.harbor && process.env.harbor[option]) {
      return process.env.harbor[option];
    }

    const config = load('harbor.config.js');

    if (config instanceof Object && defaultConfig[option] instanceof Object) {
      if (option && process.env.harbor instanceof Object) {
        // Cache the actual defined config within the Node process.
        process.env.harbor[option] = config[option];
      }

      return Object.assign(defaultConfig[option], config[option]);
    }

    return Object.assign(defaultConfig, config);
  }
}

module.exports = ConfigManager;
