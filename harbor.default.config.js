import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import autoprefixer from 'autoprefixer';
import combineDuplicateSelectors from 'postcss-combine-duplicated-selectors';
import cssnano from 'cssnano';
import stylelint from 'stylelint';

const styleLintConfig = glob.sync('.stylelintrc*');
const browserListConfig = glob.sync('.browserlistrc*');
const babelConfig = glob.sync('.babelrc*');

export default {
  workers: {
    Cleaner: {
      hook: ['clean', 'prepare::0', 'default::0'],
    },
    FileSync: {
      hook: ['sync', 'prepare::1', 'default::1'],
      patterns: ['images', 'webfonts'],
    },
    JsCompiler: {
      entry: {
        main: '**/javascripts/**/*.js',
        modules: 'modules/*/*/*.js',
      },
      hook: ['js', 'javascripts', 'compile', 'default::1'],
      plugins: {
        transform: babelConfig.length
          ? null
          : JSON.parse(
              fs.readFileSync(
                path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.babelrc')
              )
            ),
      },
    },
    SassCompiler: {
      hook: ['sass', 'stylesheets', 'compile', 'default::1'],
      options: {},
      plugins: {
        stylelint: {
          plugins: ['stylelint-scss'],
          rules: styleLintConfig.length
            ? {}
            : {
                'selector-max-compound-selectors': 3,
                'no-duplicate-selectors': null,
                'no-descending-specificity': null,
              },
          extends: 'stylelint-config-recommended-scss',
        },
      },
      entry: {
        main: '**/stylesheets/**/**.scss',
      },
    },
    SvgSpriteCompiler: {
      hook: ['svg', 'images', 'compile', 'default::1'],
      prefix: '',
      entry: {
        svgsprite: 'images/*/**.svg',
      },
      options: {
        svgo: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  convertPathData: false,
                  removeViewBox: false,
                  convertColors: {
                    currentColor: true,
                  },
                  removeAttrs: {
                    preserveCurrentColor: true,
                    attrs: '(stroke|fill)',
                  },
                },
              },
            },
          ],
        },
      },
    },
    Resolver: {
      hook: ['resolve', 'prepare::2', 'default::2'],
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
      hook: 'minify',
      options: {
        minify: {},
        bundle: true,
      },
    },
    StyleOptimizer: {
      hook: 'minify',
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
      hook: 'styleguide',
      entry: {
        main: '**/*.stories.@(js|mdx)',
      },
      options: {
        alias: {
          '@theme': process.cwd(),
        },
        globalMode: 'strict',
        optimization: {
          minimize: true,
        },
        addons: ['@storybook/addon-essentials', '@storybook/addon-links'],
        configDirectory: path.resolve(process.cwd(), '.storybook'),
        builderDirectory: path.resolve(process.cwd(), '.twing'),
        staticDirectory: 'storybook-static',
      },
    },
    VisualTester: {
      hook: 'test',
      entry: {
        static: 'storybook-static/**/*.html',
      },
      options: {
        ignoredFiles: ['iframe.html'],
        acceptedFileExtensions: ['html'],
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
          workers: ['SassCompiler'],
        },
        javascripts: {
          event: 'change',
          path: '**/javascripts/**/**.js',
          workers: ['JsCompiler'],
        },
        svgprites: {
          event: 'all',
          path: '**/images/**/**.svg',
          workers: ['SvgSpriteCompiler'],
        },
        sync: {
          event: 'add',
          path: ['webfonts/**', 'images/**'],
          workers: ['FileSync'],
        },
      },
    },
  },
};
