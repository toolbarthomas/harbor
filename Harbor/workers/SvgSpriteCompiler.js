import fs from 'fs';
import imagemin from 'imagemin';
import mkdirp from 'mkdirp';
import path from 'path';
import svgstore from 'svgstore';

import Worker from './Worker.js';

/**
 * Create SVG sprites from the configured entries.
 */
export default class SvgSpriteCompiler extends Worker {
  constructor(services) {
    super(services);
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    this.prefix = this.config.prefix || 'svg--';

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return super.resolve();
    }

    await Promise.all(
      entries.map(
        (name, index) =>
          new Promise(async (cb) => {
            const entry = this.entry[index];

            if (entry.length) {
              await this.prepareCwd(entry, name);
              await this.processCwd(entry, name);
            } else {
              this.Console.warning(`Unable to find entry from: ${p}`);
            }

            cb();
          })
      )
    );

    super.resolve();
  }

  /**
   * Prepares the defined image entries so it can be used within an inline SVG
   * sprite.
   *
   * @param {string[]} cwd The defined image entries that will be prepared.
   * @param {string} name The name of the image entry collection.
   */
  async prepareCwd(cwd, name) {
    this.Console.log(`Preparing sprite ${name}...`);

    return new Promise((done) => {
      imagemin(cwd, this.config.options).then((result) => {
        this.optimizedCwd = result;

        this.Console.log(`Done preparing sprite.`);

        done();
      });
    });
  }

  /**
   * Processes all Svg files within the defined directory.
   *
   * @param {Array} cwd The actual array to process.
   * @param {string} filename The filename for the processed sprite.
   */
  async processCwd(cwd, filename) {
    return new Promise((done) => {
      if (!this.optimizedCwd) {
        return;
      }

      this.Console.log(`Generating sprite.`);

      const basePath = path.join(
        this.environment.THEME_SRC,
        path.dirname(this.config.entry[filename].replace('/*', ''))
      );

      const destination = path
        .resolve(basePath)
        .replace(
          path.resolve(this.environment.THEME_SRC),
          path.resolve(this.environment.THEME_DIST)
        );
      const name = `${filename}.svg` || 'svgsprite.svg';

      const sprite = this.optimizedCwd.reduce(
        (store, entry, index) => {
          return store.add(this.prefix + path.basename(cwd[index], '.svg'), entry.data);
        },
        svgstore({
          inline: true,
          svgAttrs: {
            xmlns: 'http://www.w3.org/2000/svg',
          },
        })
      );

      if (sprite) {
        mkdirp(destination).then((dirPath, error) => {
          if (error) {
            this.Console.error(error);

            return super.resolve();
          }

          fs.writeFileSync(path.resolve(destination, name), sprite.toString());

          this.Console.log(`Done generating: ${path.join(destination, name)}`);

          done();
        });
      } else {
        done();
      }
    });
  }
}
