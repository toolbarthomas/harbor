import { outdent } from 'outdent';
import camelcase from 'camelcase';
import fs from 'fs';
import glob from 'glob';
import mkdirp from 'mkdirp';
import path from 'path';
import prettier from 'prettier';

import { Worker } from './Worker.js';

export class StyleguideHelper extends Worker {
  constructor(services) {
    super(services);

    // Keep track of the subscribed titles to prevent duplicate entries.
    this.titles = new Map();

    // Should contain the custom configured alias entries defined from the
    // StyleguideCompiler plugin.
    this.alias = {};
  }

  async init() {
    if (this.services && this.services.ConfigPublisher) {
      this.alias = this.services.ConfigPublisher.getOption('StyleguideCompiler', 'alias');
    }

    await Promise.all(this.entry.map((entry) => this.setupInitialStories(entry)));

    super.resolve();
  }

  /**
   * Creates initial styleguide entry files.
   *
   * @param {String[]} entry Creates the styleguide entry files from the defined
   * entry sources.
   */
  setupInitialStories(entry) {
    return new Promise((done) => {
      if (!entry.length) {
        done();
        return;
      }

      let destinationDirectory = '';
      if (this.getOption('destinationDirectory')) {
        destinationDirectory = path.resolve(
          this.environment.THEME_SRC,
          this.getOption('destinationDirectory')
        );

        mkdirp.sync(destinationDirectory);

        this.Console.log(
          `Successfully created styleguide configuration directory: ${destinationDirectory}`
        );
      }

      const queue = [];
      entry.forEach((source) => {
        const extname = path.extname(source);
        const story = source.replace(extname, `.stories.${this.getOption('extname')}`);

        const template = this.defineInitialTemplate(source);
        let destination = story;

        // Write the entry file to the configured destination directory.
        if (destinationDirectory) {
          const relativeSource = path
            .resolve(source)
            .replace(path.resolve(this.environment.THEME_SRC), '');
          const dirs = relativeSource
            .split(path.sep)
            .filter((s) => s.length && path.basename(source) !== s);

          mkdirp.sync(path.resolve(destinationDirectory, ...dirs));

          destination = path.resolve(destinationDirectory, ...dirs, path.basename(story));
        }

        if (!this.getOption('ignoreInitial')) {
          if (fs.existsSync(destination)) {
            this.Console.log(`Skipping existing styleguide story: ${destination}`);
            return;
          }
        }

        queue.push([destination, template]);
      });

      Promise.all(
        queue.map(
          ([destination, template]) =>
            new Promise((callback) => {
              try {
                fs.writeFile(
                  destination,
                  prettier.format(template, {
                    parser: 'babel',
                    ...super.getOption('prettier', {}),
                  }),
                  (exception) => {
                    if (exception) {
                      this.Console.warning(exception);
                    }

                    this.Console.log(`Styleguide entry template created: ${destination}`);

                    callback();
                  }
                );
              } catch (exception) {
                this.Console.warning(exception);
              }
            })
        )
      )
        .catch((exception) => {
          this.Console.error(exception);
          return super.reject();
        })
        .then(() => {
          if (queue.length) {
            this.Console.info(
              `Created ${queue.length} initial styleguide entries: ${destinationDirectory}`
            );
          } else {
            this.Console.warning(`No new styleguide entries have been generated...`);
          }

          done();
        });
    });
  }

  /**
   * Creates the initial styleguide template from the defined
   *
   * @param {String} source Defines the initial metadata for the styleguide
   * entry.
   * @param {String} destination The destination path for the new styleguide
   * entry file.
   */
  defineInitialTemplate(source) {
    const basename = path.basename(source, path.extname(source));
    const moduleName = this.filterKeywords(
      camelcase(basename, { pascalCase: true }).replace(/[^a-zA-Z]+/g, '')
    );
    const variantQueue = this.loadVariants(source);

    const template = outdent`
      ${this.useAssets(moduleName, source)}
      ${this.useVariantConfigurations(moduleName, variantQueue)}

      export default {
        title: '${this.useTitle(source)}',
        loaders: [
          async ({ args }) => ({
            ${moduleName}: await ${moduleName}(args),
          }),
        ],
      };

      export const ${this.useDefaultModule(
        moduleName,
        source
      )} = (args, { loaded }) => loaded.${moduleName};
      ${this.useDefaultModule(moduleName, source)}.args = ${moduleName}Configuration;
      ${this.useVariants(moduleName, variantQueue)}
    `;

    return template;
  }

  /**
   * Removes the defined options.ignoreKeywords for the defined styleguide
   * entry.
   *
   * @param {String} value Removes the keywords from the defined String.
   */
  filterKeywords(value) {
    if (typeof value !== 'string') {
      return value;
    }

    const ignoreKeywords = this.getOption('ignoreKeywords');

    if (!ignoreKeywords || !ignoreKeywords.length) {
      return value;
    }

    let v = value;

    ignoreKeywords.forEach((keyword) => {
      v = v.replace(new RegExp(keyword, 'ig'), '');
    });

    return v;
  }

  /**
   * Ensures the defined value is within the correct module syntax.
   *
   * @param {String} value The actual name to escape.
   * @param {String} index Inserts an additional suffix.
   */
  static escapeName(value, suffix) {
    const name = camelcase(value.replace(/[^a-zA-Z]+/g, '-'), {
      pascalCase: true,
    }).replace(/[^a-zA-Z]+/g, '');

    return suffix ? `${name}${suffix}` : name;
  }

  /**
   * Ensures spaces are inserted for the given string value.
   *
   * @param {String} value The defined value to insert spaces into.
   */
  static ensureSpacing(value) {
    if (typeof value !== 'string') {
      return value;
    }

    return value.replace(/([A-Z])/g, ' $1').trim();
  }

  /**
   * Creates additional imports for the configured variant assets.
   *
   * @param {String} moduleName The name of the module that has the actual
   * variants.
   * @param {Object} variants The object with variants that are defined from the
   * variant configuration option.
   */
  useVariantConfigurations(moduleName, variants) {
    if (!moduleName) {
      return '';
    }

    const output = [];

    Object.entries(variants).forEach(([variant, options], index) => {
      const { context, map, generateKey } = options;

      this.Console.log(`Using external configuration for variant: ${variant}`);

      if (!map && context && fs.existsSync(context)) {
        const variantName = StyleguideHelper.escapeName(
          generateKey ? path.basename(context, path.extname(context)) : variant,
          generateKey ? index : 0
        );

        output.push(`import ${variantName}Configuration from '${this.useAlias(context)}';`);
      }
    });

    return output.join('\n');
  }

  /**
   * Includes additional module exports from the default module. This is based
   * from the matched modifers.
   *
   * @param {String} moduleName The name of the module that has the actual
   * variants.
   * @param {Object} variants The object with variants that are defined from the
   * variant configuration option.
   */
  useVariants(moduleName, variants) {
    if (!(variants instanceof Object)) {
      return '';
    }

    const queue = {};
    const output = [];

    output.push('');

    Object.entries(variants).forEach(([option, variant], index) => {
      this.Console.log(`Variant found: ${moduleName} - ${option};`);
      const { context, generateKey, map, transform } = variant;

      if (!fs.existsSync(context)) {
        return;
      }

      if (!map || !map.length) {
        const variantName = StyleguideHelper.escapeName(
          generateKey ? path.basename(context, path.extname(context)) : option,
          generateKey ? index : 0
        );

        queue[variantName] = context;
      } else {
        map.forEach((v, i) => {
          const variantName = StyleguideHelper.escapeName(v, i);
          if (!queue[variantName]) {
            queue[variantName] = {};
          }

          queue[variantName][option] = typeof transform === 'function' ? transform(v) : v;
        });
      }
    });

    Object.entries(queue).forEach(([variantName, options]) => {
      const variantOptions = JSON.stringify(options);

      output.push(`export const ${variantName} = (args, { loaded }) => loaded.${moduleName};`);

      // Parse the variant configuration directly if the options is not a file
      // reference.
      if (options instanceof Object) {
        output.push(outdent`
          ${variantName}.args = {
            ${variantOptions
              .substring(1, variantOptions.length - 1)
              .split('":"')
              .join('" : "')
              .split('","')
              .join('",\n  "')},
            ...${moduleName}Configuration,
          };`);
      } else {
        output.push(
          outdent`${variantName}.args = Object.assign(${moduleName}Configuration, ${variantName}Configuration);`
        );
      }

      output.push('');
    });

    return output.join('\n');
  }

  /**
   * Inserts the required module imports and exports for the current template.
   *
   * @param {String} moduleName The module name that will be used as export.
   * @param {String} source The actual path for the module import.
   */
  useAssets(moduleName, source) {
    const assets = [];

    const configurationExtensions = super.getOption('configurationExtensions', []);
    const includeStylesheets = super.getOption('includeStylesheets', []);
    const includeScripts = super.getOption('includeScripts', []);

    const config = super.flatten(
      configurationExtensions
        .map((extension) => glob.sync(`${path.dirname(source)}/**/*.${extension}`))
        .filter((e) => e && e.length)
    );

    const configImport =
      config.length && config[0].indexOf(path.basename(source, path.extname(source))) >= 0
        ? config[0]
        : null;

    if (includeStylesheets.length) {
      // Include optional stylesheets.
      includeStylesheets.forEach((stylesheet) => {
        assets.push(`import '${this.useAlias(stylesheet)}';`);
      });
      assets.push('');
    }

    // Include optional scripts.
    if (includeScripts.length) {
      includeScripts.forEach((script) => assets.push(`import '${this.useAlias(script)}';`));
      assets.push('');
    }

    // Setup the initial import
    assets.push(`import ${moduleName} from '${this.useAlias(source)}';`);
    assets.push('');

    // Define the default template configuration.
    if (configImport) {
      assets.push(`import ${moduleName}Configuration from '${this.useAlias(configImport, true)}';`);
    } else {
      assets.push(`const ${moduleName}Configuration = {};`);
    }

    return assets.join('\n');
  }

  /**
   * Includes the proposed alias within the new entry template. A relative
   * source will be returned instead of the alias option is disabled.
   *
   * @param {String} source The initial source that will be paired with the
   * alias.
   * @param {Boolean} force Forces the function to use the initial alias.
   */
  useAlias(source, force) {
    if ((!force, this.getOption('disableAlias'))) {
      return `./${path.basename(source)}`;
    }

    const proposal = Object.values(this.alias)
      .filter((value) => path.resolve(source).indexOf(value) >= 0)
      .sort((a, b) => {
        const aa = a.split(path.sep);
        const bb = b.split(path.sep);

        return aa[0] - bb[0] || aa[1] - bb[1] || aa[2] - bb[2];
      });

    const approvedAlias = Object.keys(this.alias).filter(
      (name) => this.alias[name] === proposal[proposal.length - 1]
    );

    return path.join(
      approvedAlias[0] || '@theme',
      path.resolve(source).replace(this.alias[approvedAlias], '')
    );
  }

  /**
   * Returns the default name for initial styleguide entry module.
   *
   * @param {String} moduleName Prefixes the default export with the actual
   * module name.
   * @param {String} source The source path of the actual template file.
   */
  useDefaultModule(moduleName, source) {
    const name = super.getOption('defaultModuleName', 'Default');

    // Ensure the name is not the same as the initial moduleImport
    if (name === moduleName) {
      this.Console.warning(`Entry ${moduleName} is also used for: ${source}`);
      const uniqueName = StyleguideHelper.escapeName(`${name}__Export`);
      this.Console.info(`Using '${uniqueName}' instead.`);

      return uniqueName;
    }

    return StyleguideHelper.escapeName(name);
  }

  /**
   * Defines the styleguide entry Title with optional structure prefixes.
   *
   * @param {String} source Uses the source as entry title for the initial
   * template.
   */
  useTitle(source) {
    const moduleName = camelcase(path.basename(source, path.extname(source)), {
      pascalCase: true,
    }).replace(/[^a-zA-Z]+/g, '');

    const relativeSource = path
      .resolve(source)
      .replace(path.resolve(this.environment.THEME_SRC), '');

    const dirs = relativeSource
      .split(path.sep)
      .filter((s) => s.length && path.basename(source).indexOf(s))
      .map((s) => camelcase(s, { pascalCase: true }).replace(/[^a-zA-Z]+/g, ''));

    const sep = super.getOption('sep', ' / ');

    let result = moduleName;
    if (dirs.length && this.getOption('structuredTitle')) {
      result = `${dirs.join(sep)}${sep}${moduleName}`;
    }

    // Remove immediate duplicate title entries.
    result = result
      .split(sep)
      .reduce((acc, current) => {
        if (acc[acc.length - 1] !== current) {
          acc.push(current);
        }

        return acc;
      }, [])
      .join(sep);

    if (!this.titles.has(result)) {
      this.titles.set(result, 1);
    } else {
      this.titles.set(result, this.titles.get(result) + 1);
      result += `__${String(this.titles.get(result))}`;

      this.Console.warning(
        `Duplicate title encoutered for ${source} a suffix will be added: ${result}`
      );
    }

    return this.filterKeywords(StyleguideHelper.ensureSpacing(result));
  }

  /**
   * Includes optional template variants that is matched with the variant query.
   * @param {*} source
   */
  loadVariants(source) {
    const variants = super.getOption('variants', {});
    const queue = {};

    // Implements the template modifier variants that are based from the
    // relative stylesheet
    if (variants instanceof Object) {
      Object.entries(variants).forEach(([variant, options]) => {
        const { context, transform, query, includeDirectories } = options;

        if (!context) {
          this.Console.log(`Skipping variant: ${variant}`);
          return;
        }

        let externalSource = `${source.replace(path.extname(source), '')}${context}`;

        // Override the external configuration if the current variant has
        // any directories defined.
        if (includeDirectories && includeDirectories.length) {
          includeDirectories.forEach((directory) => {
            const cwd = path.resolve(this.environment.THEME_SRC, directory);
            const proposal = glob.sync(`${cwd}/**/${path.basename(externalSource)}`);

            if (!proposal.length) {
              return;
            }

            proposal.forEach((p) => {
              if (!fs.existsSync(p) || !fs.statSync(p).size) {
                return;
              }

              this.Console.log(`Using variant source from: ${p}`);
              externalSource = p;
            });
          });
        }

        if (fs.existsSync(externalSource)) {
          if (
            super
              .getOption('configurationExtensions', [])
              .map((e) => `.${e.replace('.', '')}`)
              .includes(path.extname(externalSource))
          ) {
            queue[variant] = {
              context: externalSource,
            };
          } else if (query) {
            const data = fs.readFileSync(externalSource).toString();
            if (!data) {
              return;
            }

            const matches = data.matchAll(query);

            queue[variant] = {
              context: externalSource,
              map: [...matches].map(([value]) => value),
              transform,
            };
            queue[variant].map = queue[variant].map
              .filter((v, i) => queue[variant].map.indexOf(v) === i)
              .map((v) => v.split(' ').join(''));
          }
        }
      });
    }

    return queue;
  }
}
