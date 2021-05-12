const { load } = require('module-config-loader');
const { resolve } = require('path');

/**
 * The Configmanager exposes the given Harbor option from the default and
 * custom configuration.
 */
class ConfigManager {
  static load(option, type) {
    const defaultConfig = load(resolve(__dirname, '../../harbor.default.config.js'));

    // Check if the defined configuration key has already been defined within
    // the current Node instance in order to prevent the confiuration from
    // loading a second time.
    if (option && process.env.harbor && process.env.harbor[type][option]) {
      return process.env.harbor[option];
    }

    const customConfig = load('harbor.config.js');

    const merge = (state, commit) => {
      const proposal = {};

      if (state && commit && commit instanceof Object && state instanceof Object) {
        Object.keys(commit).forEach((key) => {
          const val = commit[key];

          if (val instanceof Object && state[key] instanceof Object) {
            proposal[key] = merge(state[key], val);
          } else {
            proposal[key] = val;
          }
        });
      }

      return Object.assign(state, proposal);
    };

    const config = merge(defaultConfig, customConfig);

    if (type && option) {
      return config[type][option];
    } else if (type) {
      return config[type];
    } else {
      return config;
    }
  }
}

module.exports = ConfigManager;
