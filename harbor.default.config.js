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
      plugins: [stylelint()],
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
    options: {
      plugins: [autoprefixer()],
    },
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
    patterns: ['main/images'],
  },
  Cleaner: {},
};
