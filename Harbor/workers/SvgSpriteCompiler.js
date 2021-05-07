const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const imagemin = require('imagemin');
const mkdirp = require('mkdirp');
const { basename, dirname, join, resolve } = require('path');
const svgstore = require('svgstore');

const Worker = require('./Worker');

/**
 * Create SVG sprites from the configured entries.
 */
class SvgSpriteCompiler extends Worker {
  constructor(services) {
    super(services);
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    super.init();

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

      const basePath = join(
        this.environment.THEME_SRC,
        dirname(this.config.entry[filename].replace('/*', ''))
      );

      const destination = resolve(basePath).replace(
        resolve(this.environment.THEME_SRC),
        resolve(this.environment.THEME_DIST)
      );
      const name = `${filename}.svg` || 'svgsprite.svg';

      const sprite = this.optimizedCwd.reduce(
        (store, entry, index) => {
          return store.add(this.prefix + basename(cwd[index], '.svg'), entry.data);
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

          writeFileSync(resolve(destination, name), sprite.toString());

          this.Console.log(`Done generating: ${join(destination, name)}`);

          done();
        });
      } else {
        done();
      }
    });
  }
}

module.exports = SvgSpriteCompiler;
