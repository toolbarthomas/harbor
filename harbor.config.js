module.exports = {
  server: {
    sharedDirectories: ['./styleguide', '../../../core'],
  },
  fileSync: {
    patterns: ['main/images/*', 'main/images/landingpage/', 'main/webfonts'],
  },
  resolve: {
    'focus-trap': 'dist/focus-trap.min.js',
    'focus-within-polyfill': 'dist/focus-within-polyfill.js',
    svgxuse: 'svgxuse.min.js',
  },
  server: {
    sharedDirectories: ['./styleguide', '../../../core'],
  },
};
