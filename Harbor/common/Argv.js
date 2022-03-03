/**
 * Exposes the CLI arguments within Harbor.
 */
class Argv {
  constructor() {
    this.defaults = {
      minify: false,
      styleguide: false,
      task: false,
      test: false,
      verbose: false,
      watch: false,
      isProduction: false,
      ci: false,
      staticDirectory: 'storybook-static',
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
        const name = String(arg.split('=')[0]);
        const key = name.replace('--', '');
        const value = String(arg.substring(arg.indexOf('=') + 1)).replace('--', '');

        if (key === value && Object.keys(this.defaults).includes(value)) {
          // Only accept CLI arguments when defining the required plugins.
          if (name.startsWith('--')) {
            args[key] = !this.defaults[key];
          }

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
      .forEach((arg) => {
        privateArgs[arg] = args[arg];
      });

    const customArgs = {};

    const initialArgs = [].concat(...Object.keys(args).map((a) => a.split(','))).filter((b) => b);

    initialArgs
      .filter((arg) => !Object.keys(this.defaults).includes(arg))
      .forEach((arg) => {
        customArgs[arg] = args[arg];
      });

    return Object.assign(this.defaults, Object.assign(privateArgs, { customArgs }));
  }
}

export default Argv;
