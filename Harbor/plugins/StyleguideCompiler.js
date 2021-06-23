import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import webpack from 'webpack';
import YAML from 'yaml';
import outdent from 'outdent';

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

      const configPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../.storybook'
      );
      const config = path.resolve(configPath);
      const mainPath = path.resolve(configPath, 'main.cjs');

      // Define the Storybook configuration as CommonJS module since Storybook
      // currently doesn't support the implementation of ESM.
      const template = this.setup();
      fs.existsSync(mainPath) && fs.unlinkSync(mainPath);
      fs.writeFileSync(mainPath, template);

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
   * Generates the Storybook configuration with the defined Harbor configuration.
   * This ensures that the actual storybook instance is loaded as a CommonJS
   * module.
   */
  setup() {
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

    const addons =
      this.config.options && this.config.options.addons ? this.config.options.addons || [] : [];

    const template = outdent`
      const fs = require('fs');
      const glob = require('glob');
      const path = require('path');
      const webpack = require('webpack');
      const YAML = require('yaml');

      const addons = [${addons.map((p) => `"${p}"`).join(',')}]
      const stories = [${stories.map((p) => `"${p}"`).join(',')}]

      const webpackFinal = (config) => {
        // Include the Twig loader to enable support from Drupal templates.
        config.module.rules.push({
          test: /\.twig$/,
          loader: 'twing-loader',
          options: {
            environmentModulePath: '${path.resolve(
              path.dirname(fileURLToPath(import.meta.url)),
              '../builders/Twing/index.cjs'
            )}',
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
          console.log('Reading ' + libraryPaths.length + ' libraries...');

          libraryPaths.forEach((l) => {
            const c = fs.readFileSync(l).toString();

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
          })
        );

        return config;
      }

      module.exports = {
        stories,
        addons,
        webpackFinal
      }
    `;

    return template;
  }
}

export default StyleguideCompiler;
