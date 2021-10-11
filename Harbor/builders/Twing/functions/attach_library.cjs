/**
 * Includes the defined library from the registered theme libraries with the
 * required dependencies.
 */
module.exports = (name) => {
  if (!THEME_LIBRARIES || !(THEME_LIBRARIES instanceof Object)) {
    return null;
  }

  // Nesting utility that returns the required scripts, styles and dependencies.
  const assign = (library, context) => {
    const { head } = document;
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
          const link = document.createElement('link');

          link.type = 'text/css';
          link.rel = 'stylesheet';
          link.href = file;
          link.media = typeof media === 'string' ? media : 'all';

          const links = head.querySelectorAll(`link[href="${file}"]`);
          if (links.length) {
            links.forEach((l) => l.remove());
          }

          head.appendChild(link);

          // Setup a new LiveReload websocket to reload the attached stylesheets.
          if (!Number.isNaN(THEME_WEBSOCKET_PORT) && THEME_ENVIRONMENT === 'development') {
            const ws = `ws-${file.substring(file.lastIndexOf('/') + 1)}`;

            if (head.querySelector(`#${ws}`)) {
              head.querySelector(`#${ws}`).remove();
            }

            const script = document.createElement('script');
            script.id = ws;
            script.innerHTML = `
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
            `;

            head.appendChild(script);
          }
        });
      });
    }

    if (head && js) {
      Object.keys(js).forEach((file) => {
        const scripts = head.querySelectorAll(`script[src="${file}"]`);

        if (scripts.length) {
          scripts.forEach((s) => s.remove());
        }

        const script = document.createElement('script');

        script.type = 'text/javascript';
        script.src = file;
        head.appendChild(script);
      });
    }
  };

  // Assign the initial Library.
  Object.keys(THEME_LIBRARIES).forEach((library) => assign(library, name));
};
