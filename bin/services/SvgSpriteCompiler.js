const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const imagemin = require('imagemin');
const mkdirp = require('mkdirp');
const { basename, join, resolve } = require('path');
const svgstore = require('svgstore');

const Logger = require('../common/Logger');
const BaseService = require('./BaseService');

class SvgSpriteCompiler extends BaseService {
  constructor() {
    super();
  }

  init(environment) {
    return new Promise((cb) => {
      this.environment = environment;

      if (!this.config.entry instanceof Object) {
        cb();
      }

      let queue = 0;
      this.prefix = this.config.prefix || 'svg--';

      const baseDirectories = Object.keys(this.config.entry);
      baseDirectories.forEach(async (name) => {
        const cwd = sync(join(this.environment.THEME_SRC, this.config.entry[name]));

        if (cwd.length > 0) {
          await this.prepareCwd(cwd, name);
          await this.processCwd(cwd, name);
        }

        queue += 1;

        if (queue >= baseDirectories.length) {
          cb();
        }
      });
    });
  }

  async prepareCwd(cwd, name) {
    Logger.info(`Preparing sprite ${name}...`);

    this.optimizedCwd = await imagemin(cwd, this.config.options);

    Logger.success(`Done preparing sprite.`);
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

      Logger.info(`Generating sprite.`);

      const destination = resolve(cwd[0])
        .replace(/images.*$/, 'images')
        .replace(resolve(this.environment.THEME_SRC), resolve(this.environment.THEME_DIST));
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
            Logger.error(error);
          }

          writeFileSync(resolve(destination, name), sprite.toString());

          Logger.success(`Done generating: ${join(destination, name)}`);

          cb();
        });
      }
    });
  }
}

module.exports = SvgSpriteCompiler;
