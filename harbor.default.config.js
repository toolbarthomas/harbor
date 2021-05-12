const { sync } = require('glob');
const { resolve } = require('path');
const { readFileSync } = require('fs');
const autoprefixer = require('autoprefixer');
const combineDuplicateSelectors = require('postcss-combine-duplicated-selectors');
const cssnano = require('cssnano');
const imageminSvgo = require('imagemin-svgo');
const stylelint = require('stylelint');

const eslintConfig = sync('.eslintrc*');
const styleLintConfig = sync('.stylelintrc*');
const browserListConfig = sync('.browserlistrc*');
const babelConfig = sync('.babelrc*');

module.exports = {
  workers: {
    Cleaner: {
      hook: ['clean', 'prepare'],
    },
    FileSync: {
      hook: ['sync', 'prepare'],
      patterns: ['main/images', 'main/webfonts'],
    },
    JsCompiler: {
      entry: {
        main: '**/javascripts/**/*.js',
        modules: 'modules/*/*/*.js',
      },
      hook: ['js', 'javascripts'],
      plugins: {
        eslint: eslintConfig.length
          ? null
          : {
              env: {
                browser: true,
              },
              extends: ['eslint-config-airbnb-base', 'prettier'],
              globals: {
                Drupal: 'writable',
                drupalSettings: 'readonly',
              },
              plugins: ['prettier'],
              rules: {
                'import/no-extraneous-dependencies': '0',
                'prettier/prettier': 'error',
              },
            },
        transform: babelConfig.length
          ? null
          : JSON.parse(readFileSync(resolve(__dirname, '.babelrc'))),
      },
    },
    SassCompiler: {
      options: {
        outputStyle: 'compact',
      },
      hook: ['sass', 'stylesheets'],
      plugins: {
        postcss: {
          plugins: [
            stylelint(
              styleLintConfig.length
                ? {}
                : {
                    rules: {
                      'selector-max-compound-selectors': 3,
                      'no-duplicate-selectors': null,
                      'no-descending-specificity': null,
                    },
                  }
            ),
          ],
          extends: ['stylelint-config-recommended', 'stylelint'],
        },
      },
      entry: {
        main: '**/stylesheets/**/**.scss',
      },
    },
    SvgSpriteCompiler: {
      hook: ['svg', 'images'],
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
      hook: ['resolve', 'prepare'],
      cwd: 'main/vendors',
      entry: {},
    },
  },
  plugins: {
    JsOptimizer: {
      entry: {
        main: '**/javascripts/**/*.js',
        modules: 'modules/*/*/*.js',
      },
      hook: ['minify:js', 'minify'],
      options: {},
    },
    Server: {
      options: {},
    },
    StyleOptimizer: {
      hook: ['minify:css', 'minify'],
      plugins: {
        autoprefixer: autoprefixer(
          browserListConfig.length
            ? {}
            : {
                overrideBrowserslist: [('> 2%', 'last 2 versions')],
              }
        ),
        cssnano: cssnano({ mergeLonghand: false }),
        combineDuplicateSelectors: combineDuplicateSelectors({ removeDuplicatedProperties: true }),
      },
      entry: {
        main: '**/stylesheets/*.css',
      },
    },
    StyleguideCompiler: {
      hook: ['storybook', 'styleguide'],
      entry: {
        main: '**/*.stories.@(js|mdx)',
      },
      options: {
        alias: {
          '@theme': process.cwd(),
        },
        addons: [
          '@storybook/addon-actions',
          '@storybook/addon-essentials',
          '@storybook/addon-knobs',
          '@storybook/addon-links',
          '@storybook/addon-viewport',
        ],
        configDirectory: resolve(process.cwd(), '.storybook'),
      },
    },
    Watcher: {
      options: {
        delay: 200,
        duration: 1000 * 60 * 15,
      },
      hook: 'watch',
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
  },
};
