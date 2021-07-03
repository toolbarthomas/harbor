import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Environment from './Environment.js';
import Logger from '../common/Logger.js';

/**
 * The Configmanager exposes the given Harbor option from the default and
 * custom configuration.
 */
class ConfigManager {
  static load(option, type) {
    return new Promise(async (done) => {
      const defaultConfigPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../harbor.default.config.js'
      );
      const configPath = path.resolve(process.cwd(), 'harbor.config.js');

      const defaultConfig = await import(defaultConfigPath).then((m) =>
        m.default && typeof m.default === 'function' ? m.default() : m.default
      );

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
          customConfig = await import(configPath).then((m) =>
            m.default && typeof m.default === 'function' ? m.default() : m.default
          );
        } catch (exception) {
          Console.error(exception);

          customConfig = {};
        }
      }

      const merge = (state, commit) => {
        const proposal = {};

        if (state && commit && commit instanceof Object && state instanceof Object) {
          Object.keys(commit).forEach((key) => {
            if (key === 'entry' && commit[key] instanceof Object) {
              console.log('use entry', commit[key]);
              proposal[key] = commit[key];
            } else {
              const val = commit[key];

              if (val instanceof Object && state[key] instanceof Object) {
                proposal[key] = merge(state[key], val);
              } else {
                proposal[key] = val;
              }
            }
          });
        }

        return Object.assign(state, proposal);
      };

      let config;

      try {
        config = merge(defaultConfig, customConfig);

        if (Object.values(customConfig).length) {
          Console.info(`Running Harbor with custom configuration from: ${configPath}`);
        }
      } catch (exception) {
        Console.error(exception);

        done({});
      }

      if (config) {
        if (type && option) {
          done(config[type][option]);
        } else if (type) {
          done(config[type]);
        } else {
          done(config);
        }
      }
    });
  }
}

export default ConfigManager;
