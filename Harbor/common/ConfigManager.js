import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Environment from './Environment.js';
import Logger from './Logger.js';

/**
 * The Configmanager exposes the given Harbor option from the default and
 * custom configuration.
 */
class ConfigManager {
  /**
   * Merges the defined Objects and use the default values for all missing
   * properties.
   *
   * @param {Object} state The state that will be returned.
   * @param {Object} commit Merge the defined commit within the current state.
   */
  static merge(state, commit) {
    const proposal = {};

    if (state && commit && commit instanceof Object && state instanceof Object) {
      Object.keys(commit).forEach((key) => {
        if (key === 'entry' && commit[key] instanceof Object) {
          proposal[key] = commit[key];
        } else {
          const val = commit[key];

          if (val instanceof Object && state[key] instanceof Object) {
            proposal[key] = ConfigManager.merge(state[key], val);
          } else {
            proposal[key] = val;
          }
        }
      });
    }

    return Object.assign(state, proposal);
  }

  /**
   * Utility function that should resolve the ConfigManager instance.
   *
   * @param {Object} defaultConfig The default Harbor instance configuration.
   * @param {Object} customConfig The custom configuration that will be merged.
   * @param {String} type Defines configuration for the specified type only.
   * @param {String} option Defines the specified configuration option.
   * @param {String} source The path to the custom configuration.
   * @param {Function} callback The actual Promise resolver that will be called.
   * @param {Class} Console The defined Logger instance to use during the
   * callback.
   */
  static define(defaultConfig, customConfig, type, option, source, callback, Console) {
    let config = {};

    try {
      config = ConfigManager.merge(defaultConfig, customConfig);

      if (Object.values(customConfig).length) {
        Console.info(`Running Harbor with custom configuration from: ${source}`);
      }
    } catch (exception) {
      Console.error(exception);

      callback({});
    }

    if (config) {
      if (type && option) {
        callback(config[type][option]);
      } else if (type) {
        callback(config[type]);
      } else {
        callback(config);
      }
    }
  }

  static async load(option, type) {
    const output = await new Promise((done) => {
      const defaultConfigPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../harbor.default.config.js'
      );
      const configPath = path.resolve(process.cwd(), 'harbor.config.js');

      import(defaultConfigPath).then((m) => {
        const defaultConfig =
          m.default && typeof m.default === 'function' ? m.default() : m.default;

        const environment = new Environment().define();
        const Console = new Logger(environment);

        // Check if the defined configuration key has already been defined within
        // the current Node instance in order to prevent the confiuration from
        // loading a second time.
        if (option && process.env.harbor && process.env.harbor[type][option]) {
          done(process.env.harbor[option]);
        }

        let customConfig = {};

        if (fs.existsSync(configPath)) {
          try {
            import(configPath).then((mm) => {
              customConfig =
                mm.default && typeof mm.default === 'function' ? m.default() : m.default;

              ConfigManager.define(
                defaultConfig,
                customConfig,
                type,
                option,
                configPath,
                done,
                Console
              );
            });
          } catch (exception) {
            Console.error(exception);

            done({});
          }
        } else {
          ConfigManager.define(
            defaultConfig,
            customConfig,
            type,
            option,
            configPath,
            done,
            Console
          );
        }
      });
    });

    return output;
  }
}

export default ConfigManager;
