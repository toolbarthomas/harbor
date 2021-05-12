const glob = require('glob');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const { DefinePlugin } = require('webpack');
const { exec } = require('child_process');

const Plugin = require('./Plugin');
const FileSync = require('../workers/FileSync');
const { workers } = require('../../harbor.default.config');

/**
 * Create a new Styleguide with the compiled assets from the destination
 * directory.
 */
class StyleguideCompiler extends Plugin {
  constructor(services, options, workers) {
    super(services, options, workers);
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    await new Promise((cb) => {
      const bin =
        this.environment.THEME_ENVIRONMENT === 'production' ? 'build-storybook' : 'start-storybook';

      const script = fs.existsSync(path.resolve(`node_modules/.bin/${bin}`))
        ? path.resolve(`node_modules/.bin/${bin}`)
        : path.resolve(`../../node_modules/.bin/${bin}`);

      const config = path.resolve(__dirname, '../../.storybook');

      let command;

      if (this.environment.THEME_ENVIRONMENT === 'production') {
        command = `node ${script} -c ${config} -o ${path.join(
          this.environment.THEME_DIST,
          'storybook-static'
        )}`;
      } else {
        command = `node ${script} -s ${process.cwd()} -c ${config} -p ${
          this.environment.THEME_PORT
        }`;
      }

      const shell = exec(command);

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
   * Creates the Storybook Webpack Configuration Object that is compatible
   * with the Drupal template language.
   */
  setupTwing() {
    if (!this.config.entry instanceof Object) {
      return;
    }

    // Lookup any stories within the defined THEME_SRC environment variable.
    const stories = [].concat.apply(
      [],
      Object.values(this.config.entry).map((entry) =>
        glob.sync(path.join(this.environment.THEME_SRC, entry)).map((e) => path.resolve(e))
      )
    );

    const webpackFinal = (config) => {
      // Include the Twig loader to enable support from Drupal templates.
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

      // Use the defined styleguide alias that should match with the template
      // alias.
      if (config.resolve && config.resolve.alias) {
        config.resolve.alias = Object.assign(this.config.options.alias, config.resolve.alias);
      }

      // Include the Drupal library context within the Storybook instance that
      // can be used for the Drupal related Twig extensions.
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
      }

      // Enable the sprite paths within the Styleguide as global context.
      const sprites = {};
      if (this.workers && this.workers.SvgSpriteCompiler) {
        try {
          const { entry } = this.workers.SvgSpriteCompiler.config;

          Object.keys(entry).forEach((n) => {
            let p = path.normalize(path.dirname(entry[n])).replace('*', '');
            p = path.join(this.environment.THEME_DIST, p, `${n}.svg`);

            if (fs.existsSync(path.resolve(p))) {
              this.Console.info(`Inline SVG sprite assigned to Storybook: ${p}`);

              sprites[n] = p;
            }
          });
        } catch (exception) {
          this.Console.warning(`Unable to expose compiled inline SVG sprites: ${exception}`);
        }

        config.plugins.push(
          new DefinePlugin({
            THEME_LIBRARIES: JSON.stringify(libraries),
            THEME_DIST: `"${path.normalize(this.environment.THEME_DIST)}/"`,
            THEME_SPRITES: JSON.stringify(sprites),
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
