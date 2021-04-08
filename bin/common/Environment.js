const { config } = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path');

/**
 * Exposes the environment variables that have been defined
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
    };

    this.config = {};
  }

  define() {
    const source = resolve(process.cwd(), '.env');
    const env = existsSync(source) ? config({ path: source }) : {};

    const parsed = env.parsed || {};

    // Inherit any missing option from the defaults Object.
    Object.keys(this.defaults).forEach((defaultOption) => {
      if (!Object.prototype.hasOwnProperty.call(parsed, defaultOption)) {
        parsed[defaultOption] = this.defaults[defaultOption];
      }
    });

    // Enable DEVMODE flag if the current environment is set to 'development'.
    parsed.THEME_DEVMODE = parsed.THEME_ENVIRONMENT === 'development';

    this.config = parsed;

    return parsed;
  }
}

module.exports = Environment;
