const { config } = require('dotenv');
const { existsSync } = require('fs');
const { resolve } = require('path');

/**
 * Exposes the environment variables that have been defined
 * within the optional dotenv (.env) file within the running working directory.
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
      THEME_DEBUG: false,
      THEME_ENVIRONMENT: 'production',
    };

    this.config = {};
  }

  /**
   * Loads the environment configuration from the optional environment file.
   */
  define() {
    const source = resolve(process.cwd(), '.env');
    const env = existsSync(source) ? config({ path: source }) : {};

    if (env.error) {
      throw env.error;
    }

    const parsed = env.parsed || {};

    // Inherit any missing option from the defaults Object.
    Object.keys(this.defaults).forEach((defaultOption) => {
      if (!Object.prototype.hasOwnProperty.call(parsed, defaultOption)) {
        parsed[defaultOption] = this.defaults[defaultOption];
      }

      if (
        typeof parsed[defaultOption] === 'string' &&
        parsed[defaultOption].toLowerCase() === 'false'
      ) {
        parsed[defaultOption] = false;
      }

      if (
        typeof parsed[defaultOption] === 'string' &&
        parsed[defaultOption].toLowerCase() === 'true'
      ) {
        parsed[defaultOption] = true;
      }
    });

    this.config = parsed;

    return parsed;
  }
}

module.exports = Environment;
