const path = require('path');

/**
 * Includes the defined library from the registered theme libraries with the
 * required dependencies.
 */
module.exports = function (name) {
  if (!THEME_LIBRARIES || !THEME_LIBRARIES instanceof Object) {
    return;
  }

  // Stores all required library entries.
  const jsSnippets = [];
  const cssSnippets = [];

  // Nesting utility that returns the required scripts, styles and dependencies.
  const assign = (library, context) => {
    const n = context.split('/')[0];
    const key = context.split('/')[1];

    if (n !== library.replace('.libraries.yml', '')) {
      return;
    }

    const assets = THEME_LIBRARIES[library][key];
    if (!assets) {
      return;
    }

    const { css, js, dependencies } = assets;

    if (dependencies) {
      // Include the dependencies for the current library assignment.
      dependencies.forEach((dependency) => {
        Object.keys(THEME_LIBRARIES).forEach((dependencyLibrary) =>
          assign(dependencyLibrary, dependency)
        );
      });
    }

    if (css) {
      Object.keys(css).forEach((section) => {
        Object.keys(css[section]).forEach((file) => {
          const { media } = css[section][file];

          cssSnippets.push(
            `<link rel="stylesheet" href="${file.replace(THEME_DIST, '')}" media="${
              typeof media === 'string' ? media : 'all'
            }" />`
          );
        });
      });
    }

    if (js) {
      Object.keys(js).forEach((file) => {
        jsSnippets.push(
          `<script type="text/javascript" src="${file.replace(THEME_DIST, '')}"></script>`
        );
      });
    }
  };

  // Assign the initial Library.
  Object.keys(THEME_LIBRARIES).forEach((library) => assign(library, name));

  return [cssSnippets, jsSnippets].map((s) => s.join('')).join('');
};
