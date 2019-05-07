const { config } = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path');

/**
 * Exposes the environment variables that has been defined
 * within the optional dotenv (.env) file.
 *
 * Harbor will define these environment variables and will fall back
 * to the default values when missing.
 */
class Environment {
  constructor() {
    this.defaults = {
      THEME_SRC: './src',
      THEME_DIST: './dist',
      THEME_PORT: 8080,
      THEME_ENVIRONMENT: 'development',
      THEME_STYLEGUIDE_DIRECTORY: 'styleguide',
      THEME_RESOURCES: [],
    };
  }

  get config() {
    const source = resolve(process.cwd(), '.env');
    const env = existsSync(source) ? config({ path: source }) : {};

    const parsed = env.parsed || {};

    // Inherit any missing option from the defaults Object.
    Object.keys(this.defaults).forEach(defaultOption => {
      if (!Object.prototype.hasOwnProperty.call(parsed, defaultOption)) {
        parsed[defaultOption] = this.defaults[defaultOption];
      }
    });

    return parsed;
  }
}

module.exports = Environment;
