/**
 * Exposes the CLI arguments within Harbor.
 */
export default class Argv {
  constructor() {
    this.defaults = {
      task: false,
      watch: false,
      styleguide: false,
      optimize: false,
      serve: false,
      verbose: false,
    };
  }

  /**
   * Returns the parsed Command Line Arguments.
   */
  get args() {
    const argv = process.argv instanceof Object ? process.argv : [];
    const args = {};

    if (argv.length > 2) {
      argv.slice(2).forEach((arg) => {
        const key = String(arg.split('=')[0]).replace('--', '');
        const value = String(arg.substring(arg.indexOf('=') + 1)).replace('--', '');

        if (key === value) {
          args[key] = !this.defaults[key];

          return;
        }

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
