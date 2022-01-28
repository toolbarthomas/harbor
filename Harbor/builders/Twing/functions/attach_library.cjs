/**
 * Includes the defined library from the registered theme libraries with the
 * required dependencies.
 */
module.exports = (name) => {
  function attach() {
    const fragment = new DocumentFragment();
    let libraries = {};

    // Loads the defined library scripts within a synchronous order after the
    // initial fragment insertion.
    const postRender = [];

    try {
      libraries =
        typeof THEME_LIBRARIES === 'string' ? JSON.parse(THEME_LIBRARIES) : THEME_LIBRARIES;
    } catch (exception) {
      // eslint-disable-next-line no-console
      console.error(`Unable to attach library: ${exception}`);
    }

    const assign = (library, context) => {
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
            assign(dependencyLibrary, dependency)
          );
        });
      }

      const attachedCss = [];
      if (css) {
        Object.keys(css).forEach((section) => {
          Object.keys(css[section]).forEach((file) => {
            const { media } = css[section][file];
            const link = document.createElement('link');

            link.type = 'text/css';
            link.rel = 'stylesheet';

            // Try to override the defined library with the configured
            // librariesOverride option.
            try {
              if (THEME_LIBRARIES_OVERRIDES instanceof Object) {
                if (Object.keys(THEME_LIBRARIES_OVERRIDES).includes(file)) {
                  link.href = THEME_LIBRARIES_OVERRIDES[file];
                }
              }
            } catch (error) {
              console.log(error);
            }

            if (!link.href) {
              link.href = file;
            }

            link.media = typeof media === 'string' ? media : 'all';

            const links = document.head.querySelectorAll(`link[href="${file}"]`);
            if (links.length) {
              links.forEach((l) => l.remove());
            }

            attachedCss.push(link);

            fragment.appendChild(link);

            if (typeof THEME_WEBSOCKET_PORT !== 'undefined') {
              // Setup the LiveReload functionality.
              const ws = `ws-${encodeURIComponent(
                file.substring(file.lastIndexOf('/') + 1)
              ).replaceAll('%', '')}`;

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

      const attachedScripts = [];
      if (js) {
        Object.keys(js).forEach((file) => {
          const scripts = document.head.querySelectorAll(`script[src="${file}"]`);
          if (scripts.length) {
            scripts.forEach((s) => s.remove());
          }

          const script = document.createElement('script');

          script.type = 'text/javascript';

          // Try to override the defined library with the configured
          // librariesOverride option.
          try {
            if (THEME_LIBRARIES_OVERRIDES instanceof Object) {
              if (Object.keys(THEME_LIBRARIES_OVERRIDES).includes(file)) {
                script.src = THEME_LIBRARIES_OVERRIDES[file];
              }
            }
          } catch (error) {
            console.log(error);
          }

          if (!script.src) {
            script.src = file;
          }

          if (js[file].attributes instanceof Object) {
            Object.entries(js[file].attributes).forEach(([attribute, value]) => {
              script[attribute] = value;
            });
          }

          // We don't add it to the render fragment since the actual script will
          // be inserted after the initial has been rendered.
          attachedScripts.push(script);
        });
      }

      const commit = {
        scripts: attachedScripts,
        css: attachedCss,
      };

      postRender.push(commit);
    };

    Object.keys(libraries).forEach((library) => assign(library, name));

    document.head.appendChild(fragment);

    if (postRender.length) {
      const queue = [];
      postRender.forEach(
        ({ scripts }) =>
          scripts.length &&
          scripts.forEach((script) => {
            queue.push(script);
          })
      );

      if (queue.length) {
        const awaitLoad = (index) => {
          if (queue[index + 1]) {
            queue[index].addEventListener('load', () => awaitLoad(index + 1));
          }

          document.head.appendChild(queue[index]);
        };

        awaitLoad(0);
      }
    }
  }

  return Promise.resolve(attach());
};
