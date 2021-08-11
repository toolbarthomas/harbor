import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs, { mkdir } from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';
import outdent from 'outdent';
import path from 'path';
import webpack from 'webpack';
import YAML from 'yaml';
import { snakeCase } from 'snake-case';

import Plugin from './Plugin.js';
import FileSync from '../workers/FileSync.js';

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
        : path.resolve(`../../.bin/${bin}`);

      const config = path.resolve(this.configPath());

      // Define the Storybook builder configuration as CommonJS module since Storybook
      // currently doesn't support the implementation of ESM.
      this.setupBuilder();

      // Define the Storybook configuration as CommonJS module since Storybook
      // currently doesn't support the implementation of ESM.
      this.setupMain(config);

      // Extends the Storybook instance with the optional custom configuration.
      if (this.config.options.configDirectory) {
        const customConfigurations = glob
          .sync(path.join(this.config.options.configDirectory, '/**'))
          .filter(
            (configuration) =>
              [
                path.basename(this.config.options.configDirectory),
                'index.ejs',
                'main.js',
                'main.cjs',
              ].includes(path.basename(configuration)) === false
          );

        if (customConfigurations.length) {
          this.Console.info(
            `Using storybook configuration from: ${this.config.options.configDirectory}`
          );

          customConfigurations.forEach((configuration) => {
            this.Console.log(`Extending configuration: ${configuration}`);

            const destination = path.join(this.configPath(), path.basename(configuration));

            if (destination !== configuration) {
              fs.existsSync(destination) && fs.unlinkSync(destination);

              fs.existsSync(configuration) && fs.copyFileSync(configuration, destination);
            }
          });
        }
      }

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
   * Prepares the configuration for the Styleguide loader that should render the
   * defined Twig templates.
   */
  setupBuilder() {
    const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../builders/Twing');

    const destination = path.resolve(this.configPath(), 'twing.cjs');

    const queryEntry = (cwd, query) => glob.sync(path.join(cwd, query));

    const defaultFilters = queryEntry(cwd, 'filters/**.cjs');
    const customFilters = this.config.options.builderDirectory
      ? queryEntry(this.config.options.builderDirectory, 'filters/**.cjs')
      : [];

    const defaultFunctions = queryEntry(cwd, 'functions/**.cjs');
    const customFunctions = this.config.options.builderDirectory
      ? queryEntry(this.config.options.builderDirectory, 'functions/**.cjs')
      : [];

    const definedFilters = this.extendBuilder(defaultFilters, customFilters);
    const definedFunctions = this.extendBuilder(defaultFunctions, customFunctions);

    const template = outdent`
      const path = require('path');
      const { TwingEnvironment, TwingLoaderFilesystem, TwingFilter, TwingFunction } = require('twing');

      // Should contain the default & custom Twing filters to extend.
      const filters = {};
      ${definedFilters
        .map(
          (definedFilter) => outdent`
            try {
              filters['${this.defineBuilderExtensionName(
                definedFilter
              )}'] = require('${definedFilter}');
            } catch (exception) {
              throw Error(exception);
            }`
        )
        .join('\n\n')}

      // Should contain the default & custom Twing functions to extend.
      const functions = {};
      ${definedFunctions
        .map(
          (definedFunction) => outdent`
            try {
              functions['${this.defineBuilderExtensionName(
                definedFunction
              )}'] = require('${definedFunction}');
            } catch (exception) {
              throw Error(exception);
            }`
        )
        .join('\n\n')}

      // Defines the absolute path to the theme specific packages.
      const theme = path.resolve('${process.cwd()}');

      // Use the resolved paths as base path for the Twing Filesystem.
      const loader = new TwingLoaderFilesystem([theme]);

      // In storybook we get this returned as an instance of
      // TWigLoaderNull, we need to avoid processing this.
      // Use namespace to maintain the exact include paths for both Drupal and
      // Storybook.
      if (typeof loader.addPath === 'function') {
        if (${this.config.options.alias !== undefined}) {
          try {
            const alias = ${JSON.stringify(this.config.options.alias)};

            if (alias) {
              Object.keys(alias).forEach((name) => {
                loader.addPath(path.resolve(process.cwd(), alias[name]), name.replace('@', ''));
              });
            }
          } catch (exception) {
            throw new Error(exception);
          }
        }
      }

      const environment = new TwingEnvironment(loader, { autoescape: false });

      if (Object.keys(filters).length) {
        Object.keys(filters).forEach((filter) => {
          try {
            environment.addFilter(new TwingFilter(filter, filters[filter]));
          } catch(error) {
            console.error(error);
          }
        });
      }

      if (Object.keys(functions).length) {
        Object.keys(functions).forEach((fn) => {
          try {
            const handler = (typeof functions[fn] === 'function') ? functions[fn] : (...args) => args;

            environment.addFunction(new TwingFunction(fn, handler));
          } catch(error) {
            console.error(error);
          }
        });
      }

      module.exports = environment;
    `;

    fs.existsSync(destination) && fs.unlinkSync(destination);
    mkdirp.sync(path.dirname(destination));
    fs.writeFileSync(destination, template);
  }

  /**
   * Defines the actual entry list from the given custom & default entries.
   *
   * @param {*} initial The default builder extensions that will be loaded.
   * @param {*} proposal The custom builder extensions where the non-exsiting
   * entry is merged.
   *
   * @returns {array} The entries to extend within the Builder instance.
   */
  extendBuilder(initial, proposal) {
    return [
      ...initial,
      ...proposal.filter((commit) => {
        const name = this.defineBuilderExtensionName(commit);

        if (
          !initial.map((initialItem) => this.defineBuilderExtensionName(initialItem)).includes(name)
        ) {
          return commit;
        } else {
          this.Console.warning(`Custom builder function '${name}' already exists.`);
          this.Console.warning(
            `Using ${
              initial.filter((commit) => name === this.defineBuilderExtensionName(commit))[0]
            } instead of: ${commit}`
          );
        }
      }),
    ];
  }

  /**
   * Defines the actual name for the given Builder extension.
   *
   * @param {string} source Defines the name from the given source.
   */
  defineBuilderExtensionName(source) {
    return snakeCase(path.basename(source, path.extname(source)));
  }

  /**
   * Generates the Storybook configuration with the defined Harbor configuration.
   * This ensures that the actual storybook instance is loaded as a CommonJS
   * module.
   */
  setupMain(cwd) {
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

    let addons =
      this.config.options && this.config.options.addons ? this.config.options.addons || [] : [];

    // Restricts the following addons since they are included by the core
    // Storybook package.
    const restricedAddons = [
      '@storybook/addon-actions',
      '@storybook/addon-controls',
      '@storybook/addon-viewport',
    ];

    addons = addons.filter((addon) => !restricedAddons.includes(addon));

    const previewMainTemplate = path.resolve(cwd, 'index.ejs');
    const environmentModulePath = path.resolve(this.configPath(), 'twing.cjs');

    const template = outdent`
      const fs = require('fs');
      const glob = require('glob');
      const path = require('path');
      const webpack = require('webpack');
      const YAML = require('yaml');

      const addons = [${addons.map((p) => `'${p}'`).join(',')}]
      const stories = [${stories.map((p) => `'${p}'`).join(',')}]

      const webpackFinal = (config) => {
        // Include the Twig loader to enable support from Drupal templates.
        config.module.rules.push({
          test: /\.twig$/,
          loader: 'twing-loader',
          options: {
            environmentModulePath: '${environmentModulePath}',
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
          config.resolve.alias = Object.assign(${JSON.stringify(
            this.config.options.alias
          )}, config.resolve.alias);
        }

        // Include the Drupal library context within the Storybook instance that
        // can be used for the Drupal related Twig extensions.
        const libraryPaths = [${glob
          .sync('*.libraries.yml')
          .map((p) => `'${p}'`)
          .join(',')}];
        const libraries = {};
        if (libraryPaths.length) {
          libraryPaths.forEach((l) => {
            const c = fs.readFileSync(l).toString();
            console.log('Reading library: ' + l);

            if (c && c.length) {
              try {
                libraries[path.basename(l)] = YAML.parse(c);
              } catch (exception) {
                console.log(exception);
              }
            }
          });
        }

        // Enable the sprite paths within the Styleguide as global context.
        const sprites = {};
        const enableSprites = ${
          this.workers &&
          this.workers.SvgSpriteCompiler &&
          this.workers.SvgSpriteCompiler.config.entry
            ? true
            : false
        };
        if (enableSprites) {
          try {
            const entry = ${JSON.stringify(this.workers.SvgSpriteCompiler.config.entry)};

            Object.keys(entry).forEach((n) => {
              let p = path.normalize(path.dirname(entry[n])).replace('*', '');
              p = path.join('${this.environment.THEME_DIST}', p, n + '.svg');

              if (fs.existsSync(path.resolve(p))) {
                sprites[n] = p;
              }

            });
          } catch (exception) {
            console.log('Unable to expose compiled inline SVG sprites:' + exception);
          }
        }

        config.plugins.push(
          new webpack.DefinePlugin({
            THEME_LIBRARIES: JSON.stringify(libraries),
            THEME_DIST: '${path.normalize(this.environment.THEME_DIST)}/',
            THEME_SPRITES: JSON.stringify(sprites),
            THEME_ALIAS: JSON.stringify(${JSON.stringify(this.config.options.alias)}),
            THEME_WEBSOCKET_PORT: '${this.environment.THEME_WEBSOCKET_PORT}',
          })
        );

        process.env['THEME_ALIAS'] = JSON.stringify(${JSON.stringify(this.config.options.alias)});

        return config;
      }

      module.exports = {
        stories,
        addons,
        webpackFinal,
        previewMainTemplate: '${previewMainTemplate}',
      }
    `;

    const mainPath = path.resolve(this.configPath(), 'main.cjs');

    fs.existsSync(mainPath) && fs.unlinkSync(mainPath);
    mkdirp.sync(path.dirname(mainPath));
    fs.writeFileSync(mainPath, template);
  }

  /**
   * Returns the path of the styleguide configuration directory.
   */
  configPath() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.storybook');
  }
}

export default StyleguideCompiler;
