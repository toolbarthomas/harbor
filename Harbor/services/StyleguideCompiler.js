const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const YAML = require('yaml');
const { DefinePlugin } = require('webpack');
const { exec, execFileSync } = require('child_process');

const BaseService = require('./BaseService');
const { stdout } = require('process');
const { sync } = require('mkdirp');
const FileSync = require('./FileSync');

/**
 * Create a new Styleguide with the compiled assets from the destination
 * directory.
 */
class StyleguideCompiler extends BaseService {
  constructor(tooling) {
    super(tooling);
  }

  /**
   * Optimizes the compiled stylesheet entries.
   */
  async init() {
    super.init();

    await new Promise((cb) => {
      const shell = exec(
        `start-storybook -s ${this.environment.THEME_DIST} -c ${path.resolve(
          __dirname,
          '../../.storybook'
        )} -p ${this.environment.THEME_PORT}`
      );

      shell.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      shell.stderr.on('data', (data) => {
        process.stdout.write(data);
      });

      shell.on('error', (data) => {
        process.stdout.write(data);

        super.reject();
      });
    });
  }

  /**
   * Creates the actual Styleguide configuration object.
   */
  setup() {
    if (!this.config.entry instanceof Object) {
      return;
    }

    const stories = [].concat.apply(
      [],
      Object.values(this.config.entry).map((entry) =>
        glob.sync(path.join(this.environment.THEME_SRC, entry)).map((e) => path.resolve(e))
      )
    );

    const webpackFinal = (config) => {
      config.module.rules.push({
        test: /\.twig$/,
        loader: 'twing-loader',
        options: {
          environmentModulePath: path.resolve(__dirname, '../builders/Twing/index.js'),
        },
      });

      config.plugins.forEach((plugin, i) => {
        if (plugin.constructor.name === 'ProgressPlugin') {
          config.plugins.splice(i, 1);
        }
      });

      // Make the theme libraries available within the Twig Loader.
      const libraryPaths = glob.sync('*.libraries.yml');
      const libraries = {};
      if (libraryPaths.length) {
        this.Console.info(`Reading ${libraryPaths.length} libraries...`);

        libraryPaths.forEach((l) => {
          const c = fs.readFileSync(l).toString();

          if (c && c.length) {
            try {
              libraries[path.basename(l)] = YAML.parse(c);
            } catch (exception) {
              this.Console.warning(exception);
            }
          }
        });

        config.plugins.push(
          new DefinePlugin({
            THEME_LIBRARIES: JSON.stringify(libraries),
            THEME_DIST: `"${path.normalize(this.environment.THEME_DIST)}/"`,
          })
        );
      }

      return config;
    };

    const addons =
      this.config.options && this.config.options.addons ? this.config.options.addons || [] : [];

    return {
      stories,
      addons,
      webpackFinal,
    };
  }
}

module.exports = StyleguideCompiler;
