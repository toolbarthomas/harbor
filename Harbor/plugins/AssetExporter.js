import { outdent } from 'outdent';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

import Plugin from './Plugin.js';

class AssetExporter extends Plugin {
  async init() {
    if (!this.config.entry) {
      return super.resolve();
    }

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      this.Console.info(`Unable to use ${this.name}, no valid entries have been defined.`);
      return super.resolve();
    }

    const queue = [];
    const includeLiteral = super.getOption('includeLiteral', []);

    await Promise.all(
      super.flatten(
        entries
          .map((name) => [
            ...glob
              .sync(path.join(this.environment.THEME_DIST, this.config.entry[name]))
              .map((entry) => {
                if (queue.includes(entry)) {
                  this.Console.warning(`Skipping existing asset: ${entry}`);
                  return null;
                }

                return new Promise((done) => {
                  fs.readFile(entry, (readException, data) => {
                    if (readException) {
                      this.Console.error(readException);

                      super.reject();

                      return;
                    }

                    if (data) {
                      const literal = includeLiteral.filter((l) => l.entry === name)[0];

                      let template = '';

                      if (literal.exports && literal.import) {
                        template += `import { ${literal.exports} } from '${literal.import}';\n`;
                      }

                      template += outdent`
                      export default () => ${literal.exports || ''}\`
                        ${data}\`
                      `;

                      const destination = `${entry}.asset.js`;

                      fs.writeFile(destination, template, (writeException) => {
                        if (writeException) {
                          this.Console.error(writeException);

                          super.reject();

                          return;
                        }

                        this.Console.info(`Asset exported: ${entry} => ${destination}`);

                        done();
                      });
                    }
                  });
                });
              }),
          ])
          .filter((e) => e)
      )
    );

    return super.resolve();
  }
}

export default AssetExporter;
