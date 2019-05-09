const { statSync, writeFileSync } = require('fs');
const { sync } = require('glob');
const imagemin = require('imagemin');
const imageminSvgo = require('imagemin-svgo');
const mkdirp = require('mkdirp');
const { basename, join, resolve } = require('path');
const svgstore = require('svgstore');
const Logger = require('./common/Logger');

class SvgSpriteCompiler {
  init(config) {
    return new Promise(cb => {
      this.config = config;

      this.cwd = [
        sync(`${this.config.THEME_SRC}/main/images/*/**.svg`).filter(file => statSync(file).size),
      ];

      const baseDirectories = Object.keys(this.cwd);

      this.prefix = 'svg--';

      let queue = 0;

      baseDirectories.forEach(async directory => {
        const cwd = this.cwd[directory];

        if (cwd.length > 0) {
          await this.prepareCwd(cwd);
          await this.processCwd(cwd);
        }

        queue += 1;

        if (queue >= baseDirectories.length) {
          cb();
        }
      });
    });
  }

  async prepareCwd(cwd) {
    Logger.info(`Preparing sprite...`);

    this.optimizedCwd = await imagemin(cwd, {
      use: [
        imageminSvgo({
          plugins: [
            {
              convertPathData: false,
            },
            {
              removeViewBox: false,
            },
            {
              removeAttrs: {
                attrs: ['(fill|stroke|class|style)', 'svg:(width|height)'],
              },
            },
          ],
        }),
      ],
    });

    Logger.success(`Done preparing sprite.`);
  }

  /**
   * Processes all Svg files within the defined directory.
   *
   * @param {Array} cwd The actual array to process.
   */
  async processCwd(cwd) {
    return new Promise(cb => {
      if (!this.optimizedCwd) {
        return;
      }

      Logger.info(`Generating sprite.`);

      const destination = cwd[0]
        .replace(/images.*$/, 'images')
        .replace(this.config.THEME_SRC, this.config.THEME_DIST);
      const name = 'svgsprite.svg';

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
        mkdirp(destination, error => {
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
