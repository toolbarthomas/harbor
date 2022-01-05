const fs = require('fs');
const glob = require('glob');
const path = require('path');
const YAML = require('yaml');
/**
 * Includes the defined library from the registered theme libraries with the
 * required dependencies.
 */
module.exports = (name) => {
  function attach() {
    const output = [];
    let libraries = {};

    try {
      libraries = JSON.parse(process.env.THEME_LIBRARIES);
    } catch (exception) {
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

      if (css) {
        Object.keys(css).forEach((section) => {
          Object.keys(css[section]).forEach((file) => {
            const { media } = css[section][file];

            output.push(`
              <script>
                  (function () {
                    const link = document.createElement('link');
                    link.type = 'text/css';
                    link.rel = 'stylesheet';
                    link.href = '${file}';
                    link.media = '${typeof media === 'string' ? media : 'all'}';

                    const links = document.head.querySelectorAll("link[href='${file}']");
                    if (links.length) {
                      links.forEach((l) => l.remove());
                    }

                    document.head.appendChild(link);
                  }());
              </script>
            `);

            if (process.env && !isNaN(parseInt(process.env.THEME_WEBSOCKET_PORT))) {
              const websocketSnippet = `
                ((function () {
                  const sheets = document.querySelectorAll('link[href*="${file}"');

                  const socket = new WebSocket('ws://localhost:${parseInt(
                    process.env.THEME_WEBSOCKET_PORT
                  )}');

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
                })());
              `;

              output.push(`
                <script>
                  ((function () {
                    const ws = "ws-" + "${file.substring(file.lastIndexOf('/') + 1)}";

                    if (document.head.querySelector("#" + ws)) {
                      document.head.querySelector("#" + ws).remove();
                    }

                    const script = document.createElement('script');
                    script.id = ws;
                    script.innerHTML = \`${websocketSnippet.toString()}\`;

                    document.head.appendChild(script);
                  })());
                </script>
              `);
            }
          });
        });
      }

      if (js) {
        Object.keys(js).forEach((file) => {
          output.push(`
            <script>
              (function () {
                const scripts = document.head.querySelectorAll("script[src='${file}']");

                if (scripts.length) {
                  scripts.forEach((s) => s.remove());
                }

                const script = document.createElement('script');

                script.type = 'text/javascript';
                script.src = '${file}';

                document.head.appendChild(script);
              }());
            </script>
          `);
        });
      }
    };

    Object.keys(libraries).forEach((library) => assign(library, name));

    return output.join('\r\n');
  }

  return Promise.resolve(attach());
};
