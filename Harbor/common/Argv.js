/**
 * Exposes the CLI arguments within Harbor.
 */
export default class Argv {
  constructor() {
    this.defaults = {
      task: false,
      watch: false,
      styleguide: false,
      minify: false,
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

    const privateArgs = {};
    Object.keys(args)
      .filter((arg) => Object.keys(this.defaults).includes(arg))
      .forEach((arg) => (privateArgs[arg] = args[arg]));

    const customArgs = {};
    Object.keys(args)
      .filter((arg) => !Object.keys(this.defaults).includes(arg))
      .forEach((arg) => (customArgs[arg] = args[arg]));

    return Object.assign(this.defaults, Object.assign(privateArgs, { customArgs: customArgs }));
  }
}
