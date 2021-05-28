import { extendDefaultPlugins } from 'svgo';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import glob from 'glob';
import autoprefixer from 'autoprefixer';
import combineDuplicateSelectors from 'postcss-combine-duplicated-selectors';
import cssnano from 'cssnano';
import imageminSvgo from 'imagemin-svgo';
import stylelint from 'stylelint';

const eslintConfig = glob.sync('.eslintrc*');
const styleLintConfig = glob.sync('.stylelintrc*');
const browserListConfig = glob.sync('.browserlistrc*');
const babelConfig = glob.sync('.babelrc*');

export default {
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
            plugins: extendDefaultPlugins([
              {
                name: 'convertPathData',
                active: false,
              },
              {
                name: 'removeViewBox',
                active: false,
              },
              {
                name: 'convertColors',
                params: {
                  currentColor: true,
                },
              },
              {
                name: 'removeAttrs',
                params: {
                  attrs: ['(fill|stroke|class|style)', 'svg:(width|height)'],
                },
              },
            ]),
          }),
        ],
      },
    },
    Resolver: {
      hook: ['resolve', 'prepare'],
      cwd: 'vendors',
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
        addons: ['@storybook/addon-essentials', '@storybook/addon-knobs', '@storybook/addon-links'],
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
