import fs from 'fs';
import glob from 'glob';
import globImporter from 'node-sass-glob-importer';
import mkdirp from 'mkdirp';
import outdent from 'outdent';
import path from 'path';
import stylelint from 'stylelint';

import { Worker } from './Worker.js';

/**
 * Compiles the configured entries with Node Sass.
 */
export class SassCompiler extends Worker {
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

    /**
     * Should contain the selected Sass compiler to use within the instance.
     */
    this.compiler = null;
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (!this.entry || !this.entry.length) {
      return super.resolve();
    }

    const nodeSassPath = 'node-sass/lib/index.js';

    // Select the defined Sass compiler: Dart Sass or Node Sass.
    if (this.config.useLegacyCompiler) {
      try {
        await import(nodeSassPath);
      } catch (error) {
        if (error) {
          this.Console.warning(`The legacy Node Sass compiler is missing and will be installed.`);

          await import('child_process').then((m) => {
            this.Console.info(`Installing legacy Node Sass compiler, please wait...`);

            m.default.execSync('npm install node-sass --quiet --no-progress --no-save', {
              stdio: 'inherit',
            });
          });
        }
      }
    }

    await import(this.config.useLegacyCompiler ? nodeSassPath : 'sass').then((m) => {
      // Should update as legacy warning in the future.
      this.Console.log(`Using Sass compiler "${m.default.info}"`);

      this.compiler = m.default;
    });

    await Promise.all(
      this.entry.map(
        (entry) =>
          new Promise((cb) => {
            const cwd = entry.filter((e) => path.basename(e)[0] !== '_');

            if (cwd.length) {
              this.renderCwd(cwd).then(cb);
            } else {
              this.Console.warning(`Unable to find entry from: ${entry}`);

              cb();
            }
          })
      )
    );

    //     const method =
    //   this.environment.THEME_ENVIRONMENT === 'production' ? 'error' : 'warning';

    // // this.Console[method](exception);

    this.stylelintExceptions = this.stylelintExceptions.filter(
      (item, index) => this.stylelintExceptions.indexOf(item) === index
    );

    const length = this.stylelintExceptions.length + this.sassExceptions.length;

    if (length) {
      this.stylelintExceptions.forEach((e) =>
        this.environment.THEME_ENVIRONMENT !== 'production'
          ? this.Console.warning(e)
          : this.Console.error(e)
      );

      // Ensures no previous exceptions are inherited within endless processes.
      this.stylelintExceptions = [];
      this.sassExceptions = [];

      if (this.environment.THEME_ENVIRONMENT === 'production') {
        this.Console.error(`Sasscompiler encountered ${length} error${length !== 1 ? 's' : ''}...`);

        return super.reject();
      }
    }

    return super.resolve();
  }

  /**
   * Compiles each entry Sass file within the defined cwd asynchronously.
   *
   * @param {Array} cwd The actual array to process.
   */
  async renderCwd(cwd) {
    await Promise.all(
      cwd.map(
        (entry) =>
          new Promise((cb) => {
            this.lintFile(entry).then(() => this.renderFile(entry).then(cb));
          })
      )
    );
  }

  /**
   * Use Stylelint to check for errors within the defined entry file.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  async lintFile(entry) {
    if (!this.environment.THEME_DEBUG) {
      return;
    }

    await stylelint
      .lint(
        Object.assign(this.config.plugins.stylelint, {
          files: glob.sync(path.join(path.dirname(entry), '**/*.scss')),
          customSyntax: 'postcss-scss',
        })
      )
      .then((result) => {
        if (result.errored && result.results) {
          const exceptions = [];

          result.results.forEach((r) => {
            r.warnings
              .map(
                (warning) =>
                  outdent`
                  Stylelint ${warning.severity} - [${warning.rule}]:
                   - ${r.source}:${warning.line}:${warning.column}
                   - ${warning.text};

                `
              )
              .forEach((exception) => {
                if (!exceptions.includes(exception)) {
                  exceptions.push(exception);
                }
              });
          });

          this.stylelintExceptions.push(...exceptions);
        }
      });
  }

  /**
   * Compile the given entry Sass file and prepare it for the Filesystem.
   *
   * @param {String} entry Path to the source stylesheet to render.
   */
  renderFile(entry) {
    return new Promise((done) => {
      const destination = path
        .resolve(entry)
        .replace(
          path.resolve(this.environment.THEME_SRC),
          path.resolve(this.environment.THEME_DIST)
        )
        .replace('.scss', '.css');

      this.Console.log(`Compiling: ${entry}`);

      this.compiler.render(
        Object.assign(this.config.options || {}, {
          file: entry,
          includePaths: [this.environment.THEME_SRC],
          sourceMap: this.parseEnvironmentProperty('THEME_DEBUG'),
          importer: globImporter(),
          outFile: destination,
        }),
        async (error, result) => {
          if (error) {
            this.Console.error([
              `Sass error  encountered : ${error.file}:${error.line}:${error.column}`,
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
