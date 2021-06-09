import path from 'path';
import { render } from 'node-sass';
import fs from 'fs';
import globImporter from 'node-sass-glob-importer';
import mkdirp from 'mkdirp';
import postcss from 'postcss';
import postcssScss from 'postcss-scss';
import stylelint from 'stylelint';

import Worker from './Worker.js';

/**
 * Compiles the configured entries with Node Sass.
 */
export default class SassCompiler extends Worker {
  constructor(services) {
    super(services);

    /**
     * Flag to prevent files from being written to the Filesystem if the given
     * file has any Stylelint errors.
     */
    this.stylelintExceptions = [];

    /**
     * Flag to prevent files from being written to the Filesystem if the given
     * file has any Sass errors.
     */
    this.sassExceptions = [];
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    await Promise.all(
      this.entry.map(
        (entry) =>
          new Promise((cb) => {
            const cwd = entry.filter((e) => path.basename(e)[0] !== '_');

            if (cwd.length) {
              this.renderCwd(cwd).then(cb);
            } else {
              this.Console.warning(`Unable to find entry from: ${p}`);

              cb();
            }
          })
      )
    );

    const length = this.stylelintExceptions.length + this.sassExceptions.length;

    if (length) {
      this.Console.error(`Sasscompiler encountered ${length} error${length !== 1 ? 's' : ''}...`);

      this.stylelintExceptions = [];

      return super.reject();
    }

    super.resolve();
  }

  /**
   * Compiles each entry Sass file within the defined cwd asynchronously.
   *
   * @param {Array} cwd The actual array to process.
   */
  renderCwd(cwd) {
    return new Promise((done) => {
      Promise.all(
        cwd.map(
          (entry) =>
            new Promise(async (cb) => {
              if (String(path.basename(entry)).indexOf('_') !== 0) {
                await this.lintFile(entry);
                await this.renderFile(entry);
              }

              cb();
            })
        )
      ).then(done);
    });
  }

  /**
   * Use Stylelint to check for errors within the defined entry file.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  lintFile(entry) {
    return new Promise((done) => {
      if (!this.environment.THEME_DEBUG) {
        return done();
      }

      const source = fs.readFileSync(entry);

      return postcss(this.config.plugins.postcss.plugins || [])
        .process(source, {
          from: entry,
          syntax: postcssScss,
        })
        .then((result) => {
          this.stylelintExceptions = result.stylelint
            ? result.stylelint.stylelintError || false
            : false;

          if (this.stylelintExceptions) {
            this.Console.warning(`Stylelint encountered some problems:`);

            if (result.messages) {
              result.messages.forEach((message) => {
                if (message.text) {
                  this.Console[message.type || 'info'](
                    `- ${message.text} | ${entry}:${message.line}:${message.column}`
                  );
                }
              });
            }
          }

          done();
        });
    });
  }

  /**
   * Compile the given entry Sass file and prepare it for the Filesystem.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  renderFile(entry) {
    return new Promise((done) => {
      if (this.stylelintExceptions.length) {
        this.Console.info(`Ignoring file due to Stylelint errors: ${entry}`);
        done();
      } else {
        const destination = path
          .resolve(entry)
          .replace(
            path.resolve(this.environment.THEME_SRC),
            path.resolve(this.environment.THEME_DIST)
          )
          .replace('.scss', '.css');

        this.Console.log(`Compiling: ${entry}`);

        render(
          Object.assign(this.config.options, {
            file: entry,
            includePaths: [this.environment.THEME_SRC],
            sourceMap: this.environment.THEME_DEBUG,
            importer: globImporter(),
            outFile: destination,
          }),
          async (error, result) => {
            if (error) {
              this.Console.error([
                `Sass error encountered: ${error.file}:${error.line}:${error.column}`,
                error.message,
                `From: ${entry}`,
              ]);

              this.sassExceptions.push(error);
            } else {
              await this.writeFile(result, destination);
            }

            done();
          }
        );
      }
    });
  }

  /**
   * Create the destination directory before writing the source to
   * the filesystem.
   */
  writeFile(result, destination) {
    return new Promise((done) => {
      mkdirp(path.dirname(destination)).then((dirPath, error) => {
        if (error) {
          this.Console.error(error);

          super.reject();
        } else {
          // Write the actual css to the filesystem.
          fs.writeFileSync(destination, result.css.toString());

          // Also write the map file if the development environment is active.
          if (this.environment.THEME_DEBUG && result.map) {
            fs.writeFileSync(`${destination}.map`, result.map.toString());
          }

          this.Console.log(`Compiled: ${destination}`);
        }

        done();
      });
    });
  }
}
