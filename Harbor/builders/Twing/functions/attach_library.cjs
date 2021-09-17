/**
 * Includes the defined library from the registered theme libraries with the
 * required dependencies.
 */
module.exports = (name) => {
  if (!THEME_LIBRARIES || !(THEME_LIBRARIES instanceof Object)) {
    return null;
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
            `<link rel="stylesheet" href="${file}" media="${
              typeof media === 'string' ? media : 'all'
            }" />`
          );

          // Setup a new LiveReload websocket to reload the attached stylesheets.
          if (!Number.isNaN(THEME_WEBSOCKET_PORT) && THEME_ENVIRONMENT === 'development') {
            cssSnippets.push(
              `<script>
                (function () {
                  const sheets = document.querySelectorAll('link[href*="${file}"');

                  const socket = new WebSocket('ws://localhost:${String(THEME_WEBSOCKET_PORT)}');

                  for (let i = 0; i < sheets.length; i++) {
                    socket.addEventListener('message', (event) => {
                        console.log('Message from server ', event.data);
                        const version = '?v=' + Date.now();

                        sheets[i].href = '${file}' + version;
                    });

                    socket.addEventListener('open', (event) => {
                        socket.send('Connection established!');
                    });
                  }
                }());
              </script>`
            );
          }
        });
      });
    }

    if (js) {
      Object.keys(js).forEach((file) => {
        jsSnippets.push(`<script type="text/javascript" src="${file}"></script>`);
      });
    }
  };

  // Assign the initial Library.
  Object.keys(THEME_LIBRARIES).forEach((library) => assign(library, name));

  return [cssSnippets, jsSnippets].map((s) => s.join('')).join('');
};
