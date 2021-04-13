const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const imagemin = require('imagemin');
const mkdirp = require('mkdirp');
const { basename, dirname, join, resolve } = require('path');
const svgstore = require('svgstore');

const BaseService = require('./BaseService');

/**
 * Create SVG sprites from the configured entries.
 */
class SvgSpriteCompiler extends BaseService {
  constructor(tooling) {
    super(tooling);
  }

  /**
   * Creates SVG sprites from the configured entries.
   */
  async init() {
    super.init();

    if (!this.config.entry instanceof Object) {
      cb();
    }

    this.prefix = this.config.prefix || 'svg--';

    const entries = Object.keys(this.config.entry);

    if (!entries.length) {
      return;
    }

    await Promise.all(
      entries.map(
        (name) =>
          new Promise(async (cb) => {
            const cwd = sync(join(this.environment.THEME_SRC, this.config.entry[name]));

            if (cwd.length > 0) {
              await this.prepareCwd(cwd, name);
              await this.processCwd(cwd, name);
            }

            cb();
          })
      )
    );

    super.resolve();
  }

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
    return new Promise((cb) => {
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
          }

          writeFileSync(resolve(destination, name), sprite.toString());

          this.Console.log(`Done generating: ${join(destination, name)}`);

          cb();
        });
      } else {
        cb();
      }
    });
  }
}

module.exports = SvgSpriteCompiler;
