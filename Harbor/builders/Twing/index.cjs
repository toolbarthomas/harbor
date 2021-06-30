const path = require('path');
const { TwingEnvironment, TwingLoaderFilesystem, TwingFilter, TwingFunction } = require('twing');

const filters = require('./filters/index.cjs');
const functions = require('./functions/index.cjs');

// Defines the absolute path to the theme specific packages.
const theme = path.resolve(process.cwd());

// Use the resolved paths as base path for the Twing Filesystem.
const loader = new TwingLoaderFilesystem([theme]);

// In storybook we get this returned as an instance of
// TWigLoaderNull, we need to avoid processing this.
// Use namespace to maintain the exact include paths for both Drupal and
// Storybook.
if (typeof loader.addPath === 'function') {
  loader.addPath(theme, 'theme');
}

const environment = new TwingEnvironment(loader, { autoescape: false });

if (typeof environment.addFilter === 'function') {
  environment.addFilter(new TwingFilter('without', filters.without));
  environment.addFilter(new TwingFilter('t', filters.mock));
  environment.addFilter(new TwingFilter('trans', filters.mock));
  environment.addFilter(new TwingFilter('placeholder', filters.placeholder));
  environment.addFilter(new TwingFilter('clean_class', filters.mock));
  environment.addFilter(new TwingFilter('clean_id', filters.mock));
  environment.addFilter(new TwingFilter('render', filters.mock));
  environment.addFilter(new TwingFilter('format_date', filters.date));
  environment.addFilter(new TwingFilter('escape', filters.escape));
  environment.addFilter(new TwingFilter('drupal_escape', filters.escape));
  environment.addFilter(new TwingFilter('safe_join', filters.safeJoin));
}

if (typeof environment.addFunction === 'function') {
  environment.addFunction(new TwingFunction('add_svg', functions.addSVG));
  environment.addFunction(new TwingFunction('svg_path', functions.addSVG));
  environment.addFunction(new TwingFunction('attach_library', functions.attachLibrary));

  environment.addFunction(new TwingFunction('dump', functions.dump));
  environment.addFunction(new TwingFunction('link', functions.mock));
  environment.addFunction(new TwingFunction('active_theme', functions.mock));
}

module.exports = environment;
