const autoprefixer = require('autoprefixer');
const combineDuplicateSelectors = require('postcss-combine-duplicated-selectors');
const cssnano = require('cssnano');
const imageminSvgo = require('imagemin-svgo');
const stylelint = require('stylelint');

module.exports = {
  Cleaner: {
    hook: 'prepare',
  },
  FileSync: {
    hook: 'prepare',
    patterns: ['main/images', 'main/webfonts'],
  },
  JsCompiler: {
    entry: {
      main: 'main/javascripts/**/*.js',
      modules: 'modules/*/*/*.js',
    },
    hook: 'javascripts',
    plugins: {
      eslint: {
        env: {
          browser: true,
        },
        extends: ['eslint-config-airbnb-base', 'prettier'],
        rules: {
          'import/no-extraneous-dependencies': '0',
          'prettier/prettier': 'error',
        },
      },
      transform: {
        presets: ['@babel/env'],
      },
    },
  },
  SassCompiler: {
    options: {
      outputStyle: 'compact',
    },
    hook: 'stylesheets',
    plugins: {
      postcss: {
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
    },
    entry: {
      main: 'main/stylesheets/**/**.scss',
    },
  },
  Server: {
    hook: 'serve',
    options: {
      sharedDirectories: [],
    },
  },
  StyleOptimizer: {
    hook: 'stylesheets',
    plugins: {
      autoprefixer: autoprefixer({
        overrideBrowserslist: ['> 2%', 'last 2 versions'],
      }),
      cssnano: cssnano({ mergeLonghand: false }),
      combineDuplicateSelectors: combineDuplicateSelectors({ removeDuplicatedProperties: true }),
    },
    entry: {
      main: 'main/stylesheets/*.css',
      modules: 'modules/*/*/*.css',
    },
  },
  StyleguideCompiler: {
    hook: 'styleguide',
    entry: {
      main: 'main/**/*.stories.@(js|mdx)',
      modules: 'modules/**/*.stories.@(js|mdx)',
    },
    options: {
      addons: ['@storybook/addon-essentials', '@storybook/addon-actions', '@storybook/addon-links'],
    },
  },
  SvgSpriteCompiler: {
    hook: 'images',
    prefix: 'svg--',
    entry: {
      svgsprite: 'main/images/*/**.svg',
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
  Resolver: {
    hook: 'prepare',
    entry: {
      svgxuse: 'svgxuse.min.js',
    },
  },
  Watcher: {
    options: {
      delay: 200,
      duration: 1000 * 60 * 15,
    },
    instances: {
      stylesheets: {
        event: 'change',
        path: '**/stylesheets/**/**.scss',
        services: ['SassCompiler'],
      },
      javascripts: {
        event: 'change',
        path: '**/javascripts/**/**.js',
        services: ['JsCompiler'],
      },
      svgprites: {
        event: 'all',
        path: '**/images/**/**.svg',
        services: ['SvgSpriteCompiler'],
      },
      sync: {
        event: 'add',
        path: ['main/webfonts', 'main/images'],
        services: ['FileSync'],
      },
    },
  },
};
