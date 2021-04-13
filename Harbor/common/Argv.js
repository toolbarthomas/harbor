/**
 * Exposes the CLI arguments within Harbor.
 */
class Argv {
  constructor() {
    this.defaults = {};
  }

  /**
   * Returns the parsed Command Line Arguments.
   */
  get args() {
    const argv = process.argv instanceof Object ? process.argv : [];
    const args = {};

    if (argv.length > 2) {
      argv.slice(2).forEach((arg) => {
        const key = String(arg.split('=')[0]);
        const value = String(arg.substring(arg.indexOf('=') + 1));

        switch (value.toLocaleLowerCase()) {
          case 'true':
            args[key] = true;
            break;
          case 'false':
            args[key] = false;
            break;
          default:
            args[key] = value;
            break;
        }
      });
    }

    return Object.assign(this.defaults, args);
  }
}

module.exports = Argv;
