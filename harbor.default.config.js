import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import autoprefixer from 'autoprefixer';
import combineDuplicateSelectors from 'postcss-combine-duplicated-selectors';
import cssnano from 'cssnano';
import stylelint from 'stylelint';

const babelConfig = glob.sync('.babelrc*');
const browserListConfig = glob.sync('.browserlistrc*');
const prettierConfig = glob.sync('.prettierrc*');
const styleLintConfig = glob.sync('.stylelintrc*');

export default {
  workers: {
    AssetExporter: {
      entry: {},
      hook: ['export', 'generate::0'],
      options: {
        includeLiteral: [],
      },
    },
    Cleaner: {
      hook: ['clean', 'prepare::0', 'default::0', 'run::0'],
    },
    FileSync: {
      hook: ['sync', 'prepare::1', 'default::1', 'run::1'],
      patterns: ['images', 'webfonts'],
    },
    JsCompiler: {
      entry: {
        main: '**/javascripts/**/*.js',
        components: '**/components/**/*.js',
        modules: '**/modules/**/*.js',
      },
      hook: ['js', 'javascripts', 'compile', 'default::1', 'run::4'],
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
      hook: ['sass', 'stylesheets', 'compile', 'default::1', 'run::3'],
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
        main: '**/stylesheets/**/*.scss',
        modules: '**/modules/**/*.scss',
        components: '**/components/**/*.scss',
      },
    },
    StyleguideHelper: {
      hook: ['setup', 'generate::1', 'run::6'],
      entry: {
        main: '**/*.twig',
      },
      options: {
        prettier: JSON.parse(
          fs.readFileSync(
            prettierConfig.length
              ? prettierConfig[0]
              : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.prettierrc')
          )
        ),
        ignoreKeywords: ['harbor'],
        configurationExtensions: ['yml', 'yaml', 'json'],
        destinationDirectory: 'styleguide',
        defaultModuleName: 'Default',
        disableAlias: false,
        extname: 'js',
        ignoreInitial: false,
        sep: ' / ',
        structuredTitle: true,
        variants: {},
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
      hook: ['svg', 'images', 'compile', 'default::1', 'run::5'],
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
      hook: ['resolve', 'prepare::2', 'default::2', 'run::2'],
      cwd: 'vendors',
      entry: {},
    },
  },
  plugins: {
    JsOptimizer: {
      entry: {
        main: '**/javascripts/**/*.js',
        components: '**/components/**/*.js',
        modules: '**/modules/**/*.js',
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
        cssnano: cssnano({
          mergeLonghand: false,
          discardComments: true,
        }),
        combineDuplicateSelectors: combineDuplicateSelectors({ removeDuplicatedProperties: true }),
      },
      entry: {
        main: '**/stylesheets/**/*.css',
        modules: '**/modules/**/*.css',
        components: '**/components/**/*.css',
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
        disableTelemetry: true,
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
        duration: 1000 * 60 * 5,
      },
      hook: 'watch',
      instances: {
        stylesheets: {
          event: 'change',
          path: '**/**.scss',
          workers: ['SassCompiler', 'JsCompiler', 'AssetExporter'],
        },
        javascripts: {
          event: 'change',
          path: '**/**.js',
          workers: ['JsCompiler'],
        },
        svgprites: {
          event: 'all',
          path: '**/**.svg',
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
