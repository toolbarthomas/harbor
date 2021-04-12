const autoprefixer = require('autoprefixer');
const stylelint = require('stylelint');
const imageminSvgo = require('imagemin-svgo');

module.exports = {
  Server: {
    sharedDirectories: [],
  },
  SassCompiler: {
    options: {
      outputStyle: 'compact',
    },
    entry: {
      main: 'main/stylesheets/*.scss',
    },
  },
  PostCssCompiler: {
    options: {
      plugins: [
        stylelint({
          rules: {
            'selector-max-compound-selectors': 3,
            'no-duplicate-selectors': null,
            'no-descending-specificity': null,
          },
        }),
      ],
      extends: ['stylelint-config-recommended', 'stylelint'],
    },
    entry: {
      main: 'main/stylesheets/**/*.css',
      modules: 'modules/*/*/*.css',
    },
  },
  JsCompiler: {
    entry: {
      main: 'main/javascripts/**/*.js',
      modules: 'modules/*/*/*.js',
    },
    plugins: {
      eslint: {
        env: {
          browser: true,
        },
        extends: ['eslint-config-airbnb-base'],
        rules: {
          'import/no-extraneous-dependencies': '0',
        },
      },
      transform: {
        presets: ['@babel/env'],
      },
    },
  },
  Resolver: {
    entry: {
      svgxuse: 'svgxuse.min.js',
    },
  },
  StyleguideCompiler: {
    entry: {
      main: 'main/**/*.stories.@(js|mdx)',
      modules: 'modules/**/*.stories.@(js|mdx)',
    },
    options: {
      addons: ['@storybook/addon-essentials', '@storybook/addon-actions', '@storybook/addon-links'],
    },
  },
  StyleOptimizer: {
    plugins: [
      autoprefixer({
        overrideBrowserslist: ['> 2%', 'last 2 versions'],
      }),
    ],
    entry: {
      main: 'main/stylesheets/*.css',
      modules: 'modules/*/*/*.css',
    },
  },
  SvgSpriteCompiler: {
    prefix: 'svg--',
    entry: {
      svgsprite: '/main/images/*/**.svg',
    },
    options: {
      use: [
        imageminSvgo({
          plugins: [
            {
              convertPathData: false,
            },
            {
              removeViewBox: false,
            },
            {
              removeAttrs: {
                attrs: ['(fill|stroke|class|style)', 'svg:(width|height)'],
              },
            },
          ],
        }),
      ],
    },
  },
  FileSync: {
    patterns: ['main/images', 'main/webfonts'],
  },
  Cleaner: {},
};
