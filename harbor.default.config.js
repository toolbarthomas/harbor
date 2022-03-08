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
          configFile: styleLintConfig.length
            ? styleLintConfig[0]
            : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.stylelintrc'),
          plugins: ['stylelint-scss'],
          extends: 'stylelint-config-recommended-scss',
        },
      },
      entry: {
        main: '**/stylesheets/**/**.scss',
      },
    },
    StyleguideTester: {
      hook: ['test', 'backstop'],
      options: {
        staticDirectory: 'storybook-snapshot',
        outputPath: 'styleguide.snapshot.json',
        scenarioDirectory: path.resolve(process.cwd(), 'backstopJS/backstopScenarios'),
        backstopJS: {
          id: 'styleguide',
          debug: false,
          debugWindow: false,
          engine: 'playwright',
          engineOptions: {
            browser: 'chromium',
            args: ['--no-sandbox'],
          },
          excludeScenarios: [],
          paths: {
            bitmaps_reference: 'backstopJS/backstopReference/bitmapsReference',
            bitmaps_test: 'backstopJS/backstopTests/bitmapTests',
            engine_scripts: 'backstopJS/backstopEngine/engineScripts',
            html_report: 'backstopJS/backstopHTMLReport/HTMLreports',
            ci_report: 'backstopJS/backstopCIReport/CIreports',
          },
          viewports: [
            {
              name: 'default',
              width: 800,
              height: 600,
            },
          ],
          report: ['browser', 'ci'],
          scenarioDefaults: {
            hideSelectors: [],
            removeSelectors: [],
            selectors: ['document'],
            delay: 3000,
            readyTimeout: 60000 * 3,
            postInteractionWait: 3000,
            asyncCaptureLimit: 1,
            asyncCompareLimit: 4,
            misMatchThreshold: 0,
          },
          waitTimeout: 60000 * 3,
        },
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
        useLegacyCompiler: false,
        globalMode: false,
        librariesOverride: {},
        optimization: {
          minimize: true,
        },
        addons: [],
        configDirectory: path.resolve(process.cwd(), '.storybook'),
        builderDirectory: path.resolve(process.cwd(), '.twing'),
        staticDirectory: 'storybook-static',
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
