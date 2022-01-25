/**
 * Includes the defined library from the registered theme libraries with the
 * required dependencies.
 */
module.exports = (name) => {
  function attach() {
    const fragment = new DocumentFragment();
    let libraries = {};

    try {
      libraries =
        typeof THEME_LIBRARIES === 'string' ? JSON.parse(THEME_LIBRARIES) : THEME_LIBRARIES;
    } catch (exception) {
      // eslint-disable-next-line no-console
      console.error(`Unable to attach library: ${exception}`);
    }

    const assign = (library, context, defer) => {
      const n = context.split('/')[0];
      const key = context.split('/')[1];

      if (n !== library.replace('.libraries.yml', '')) {
        return;
      }

      const assets = libraries[library][key];
      if (!assets) {
        return;
      }

      const { css, js, dependencies } = assets;

      if (dependencies) {
        // Include the dependencies for the current library assignment.
        dependencies.forEach((dependency) => {
          Object.keys(libraries).forEach((dependencyLibrary) =>
            assign(dependencyLibrary, dependency, true)
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

            const links = document.head.querySelectorAll(`link[href="${file}"]`);
            if (links.length) {
              links.forEach((l) => l.remove());
            }

            fragment.appendChild(link);

            if (typeof THEME_WEBSOCKET_PORT !== 'undefined') {
              // Setup the LiveReload functionality.
              const ws = `ws-${file.substring(file.lastIndexOf('/') + 1)}`;

              if (document.head.querySelector(`#${ws}`)) {
                document.head.querySelector(`#${ws}`).remove();
              }

              const script = document.createElement('script');
              script.id = ws;
              script.innerHTML = `
                ((function () {
                  const sheets = document.querySelectorAll('link[href*="${file}"');

                  const socket = new WebSocket('ws://localhost:${parseInt(
                    THEME_WEBSOCKET_PORT,
                    10
                  )}');

                  for (let i = 0; i < sheets.length; i++) {
                    socket.addEventListener('message', (event) => {
                      console.log('Message from server: ', event.data);
                      const version = '?v=' + Date.now();

                      sheets[i].href = '${file}' + version;
                    });

                    socket.addEventListener('open', (event) => {
                      socket.send('Connection established!');
                    });
                  }
                })());
              `;

              fragment.appendChild(script);
            }
          });
        });
      }

      if (js) {
        Object.keys(js).forEach((file) => {
          const scripts = document.head.querySelectorAll(`script[src="${file}"]`);
          if (scripts.length) {
            scripts.forEach((s) => s.remove());
          }

          const script = document.createElement('script');

          script.type = 'text/javascript';
          script.src = file;

          if (js[file].attributes instanceof Object) {
            Object.entries(js[file].attributes).forEach(([attribute, value]) => {
              script[attribute] = value;
            });
          }

          fragment.appendChild(script);
        });
      }
    };

    Object.keys(libraries).forEach((library) => assign(library, name));

    document.head.appendChild(fragment);
  }

  return Promise.resolve(attach());
};
