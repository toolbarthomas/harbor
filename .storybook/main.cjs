const fs = require('fs');
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');
const YAML = require('yaml');

const addons = ["@storybook/addon-essentials","@storybook/addon-knobs","@storybook/addon-links"]
const stories = ["/Users/thomas.vandervelde/Private/git/harbor/src/index.stories.js"]

const webpackFinal = (config) => {
  // Include the Twig loader to enable support from Drupal templates.
  config.module.rules.push({
    test: /.twig$/,
    loader: 'twing-loader',
    options: {
      environmentModulePath: '/Users/thomas.vandervelde/Private/git/harbor/Harbor/builders/Twing/index.cjs',
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
    config.resolve.alias = Object.assign({"@theme":"/Users/thomas.vandervelde/Private/git/harbor"}, config.resolve.alias);
  }

  // Include the Drupal library context within the Storybook instance that
  // can be used for the Drupal related Twig extensions.
  const libraryPaths = [];
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
  const enableSprites = true;
  if (enableSprites) {
    try {
      const entry = {"svgsprite":"main/images/*/**.svg"};

      Object.keys(entry).forEach((n) => {
        let p = path.normalize(path.dirname(entry[n])).replace('*', '');
        p = path.join('./dist', p, n + '.svg');

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
      THEME_DIST: 'dist/',
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