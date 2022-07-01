import fs from 'fs';
import imagemin from 'imagemin';
import mkdirp from 'mkdirp';
import path from 'path';
import svgstore from 'svgstore';
import SVGO from 'svgo';
import isSvg from 'is-svg';

import { Worker } from './Worker.js';

/**
 * Create SVG sprites from the configured entries.
 */
export class SvgSpriteCompiler extends Worker {
  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    this.prefix = typeof this.config.prefix === 'string' ? this.config.prefix : 'svg--';

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return super.resolve();
    }

    await Promise.all(
      entries.map(
        (name, index) =>
          new Promise((cb) => {
            const entry = this.entry[index];

            if (entry && entry.length) {
              this.prepareCwd(entry, name).then(() => this.processCwd(entry, name).then(cb));
            } else {
              this.Console.warning(`Unable to find entry from: ${entry}`);
              cb();
            }
          })
      )
    );

    return super.resolve();
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
      imagemin(cwd, {
        plugins: [this.svgOptimize()],
      }).then((result) => {
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
        this.config.entry[filename].substring(0, this.config.entry[filename].indexOf('/*'))
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
          const d = path
            .resolve(entry.sourcePath)
            .replace(
              path.resolve(this.environment.THEME_SRC),
              path.resolve(this.environment.THEME_DIST)
            );

          mkdirp.sync(path.dirname(d));

          this.Console.log(`Writing optimized inline svg image: ${destination}`);

          fs.writeFileSync(d, entry.data);

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

          return done();
        });
      } else {
        done();
      }
    });
  }

  /**
   * Optimizes the given SVG buffer to make it compatible as an inline sprite.
   */
  svgOptimize() {
    return async (buffer) => {
      let b = buffer;

      if (!isSvg(buffer)) {
        return Promise.resolve(buffer);
      }

      if (Buffer.isBuffer(buffer)) {
        b = buffer.toString();
      }

      let result;

      try {
        result = SVGO.optimize(b, this.getOption('svgo', {}));
      } catch (exception) {
        this.Console.error(exception);
      }

      return result.data && Buffer.from(result.data);
    };
  }
}
