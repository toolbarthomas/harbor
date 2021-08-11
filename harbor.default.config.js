import { extendDefaultPlugins } from 'svgo';
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
      hook: ['clean', 'prepare::0'],
    },
    FileSync: {
      hook: ['sync', 'prepare::1'],
      patterns: ['images', 'webfonts'],
    },
    JsCompiler: {
      entry: {
        main: '**/javascripts/**/*.js',
        modules: 'modules/*/*/*.js',
      },
      hook: ['js', 'javascripts', 'compile'],
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
      options: {
        outputStyle: 'compact',
      },
      hook: ['sass', 'stylesheets', 'compile'],
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
      hook: ['svg', 'images', 'compile'],
      prefix: 'svg--',
      entry: {
        svgsprite: 'images/*/**.svg',
      },
      options: {
        svgo: {
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
                preserveCurrentColor: true,
                attrs: '(stroke|fill)',
              },
            },
          ]),
        },
      },
    },
    Resolver: {
      hook: ['resolve', 'prepare::2'],
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
      hook: ['minify:js', 'minify', 'javascripts'],
      options: {
        minify: {},
        bundle: true,
      },
    },
    Server: {
      options: {},
    },
    StyleOptimizer: {
      hook: ['minify:css', 'minify', 'stylesheets'],
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
        addons: ['@storybook/addon-essentials', '@storybook/addon-links'],
        configDirectory: path.resolve(process.cwd(), '.storybook'),
        builderDirectory: path.resolve(process.cwd(), '.twing'),
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
