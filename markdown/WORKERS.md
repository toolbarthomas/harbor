# Harbor Workers

Harbor will run the default tasks when there are no CLI arguments defined for the initial command.

It is optional to use the bundled workers but this ensures that everything works correctly within Drupal and your styleguide environment. It is also possible to include other frameworks within the environment by simply adding it within a compatible theme library configuration.

The following CLI arguments can be used in order to customize the build process.

| Argument     | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| --task       | Starts one or more worker tasks to compile the theme assets.                          |
| --verbose    | Writes extended console messages within the command line.                             |
| --styleguide | Starts the styleguide builder.                                                        |
| --watch      | Observes for file changes for the initiated tasks.                                    |
| --minify     | Minifies the processed assets.                                                        |
| --test       | Defines the testing phase for Backstopjs, should be `test`, `reference` or `approve`. |

You can also use the `harbor` command instead if you installed it globally:
This will only run the default workers but you can use additional parameters like the local commands.
Keep in mind that you need to be in the correct working directory in order to run
it correctly.

```sh
$ npm install -g @toolbarthomas/harbor
```

**Note:** Installing Harbor globally will lock you in a specific version that could be incompatible with newer Drupal installations.

## 🛠️ Getting started

A worker provides the core tasks for Harbor and can be adjusted within the configuration.
Workers can be initiated during a Harbor process by calling the defined hook within the command or as CLI argument.

```sh
# Starts the workers that have the stylesheets hook from the configuration.
$ node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets
$ node node_modules/@toolbarthomas/harbor/index.js stylesheets
```

This example will start the workers that are defined with the `stylesheets` hook, by default it will process the configured sass entry files (or it will try to use the default configured entries).

## 🪝 Hooks

The actual hooks are defined within the default configuration of each worker, these hooks can be adjusted within your custom configuration. Workers that share the same hook will be called in parallel order by default.

The order of this queue can be adjusted by adding the optional flag `::` with the index value to mark the order, this will also run the queue in a sequence.
This configuration example will start the Cleaner worker before the FileSync worker during the usage of the `prepare` task within the CLI.


```js
...
Cleaner: {
  hook: ['clean', 'prepare::0'],
  ...
},
FileSync: {
  hook: ['sync', 'prepare::1']
  ...
}
...
```

Workers that share the same hook without the double colons will run in a parallel order:

```sh
# Should initiate the compile workers in a parallel order:
$ node node_modules/@toolbarthomas/harbor/index.js --task=compile
```

The following workers are configured within the default configuration:

| Worker           | Description                                                                     | Hook(s)                                                 |
| ---------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| AssetExporter    | Wraps the defined entries as a template literal module.                         | `AssetExporter` `export`                                |
| Cleaner          | Cleans the defined THEME_DIST environment directory.                            | `Cleaner` `clean` `prepare` `default`                   |
| FileSync         | Synchronizes the defined entry files to the THEME_DIST environment directory.   | `FilSync` `sync` `prepare` `default`                    |
| JsCompiler       | Transforms the defined entry javascript files with Babel.                       | `JSCompiler` `js` `javascripts` `compile` `default`     |
| Resolver         | Resolves NPM installed vendor pacakges to the THEME_DIST environment directory. | `Resolver` `resolve` `prepare` `default`                |
| SassCompiler     | Compiles the defined entry Sass files with Node Sass.                           | `SassCompiler` `sass` `stylesheets` `compile` `default` |
| StyleguideHelper | Creates initial storybook entries from the defined Twig templates.              | `StyleguideHelper` `setup`                              |
| StyleguideTester | Initiates Snapshot tests for the styleguide with BackstopJS.                    | `StyleguideTester` `test`                               |
| SVSpriteCompiler | Creates one or more inline SVG sprites based from the configured entries.       | `SVGSpriteCompiler` `svg` `images` `compile` `default`  |

## ⚙️ Worker Configuration


### Cleaner configuration

The Cleaner is a default Harbor worker that will delete all files within the defined environment destination directory: `THEME_DIST`
No specific configuration is available for this Worker.

### FileSync configuration

The FileSync will synchronize the defined static entries to the configured environment destination directory.

| Option   | type     | Description                                                                                   |
| -------- | -------- | --------------------------------------------------------------------------------------------- |
| patterns | String[] | Copies the given patterns and it's folder structure to the environment destination directory. |

### JsCompiler configuration

The JsCompiler transforms & lints the defined entries with Babel & Eslint.
The result will be written relative to the configured environment destination directory.

| Option            | type   | Description                                                             |
| ----------------- | ------ | ----------------------------------------------------------------------- |
| plugins           | Object | Optional plugins that will be assigned to the Babel & Eslint instances. |
| plugins.eslint    | Object | The optional Eslint plugin(configuration).                              |
| plugins.transform | Object | The optional Babel transform(configuration).                            |

### SassCompiler configuration

The SassCompiler renders & prepares the defined entries with Node Sass & Postcss.
The result will be written relative to the configured environment destination directory.

| Option                    | type    | Description                                                                 |
| ------------------------- | ------- | --------------------------------------------------------------------------- |
| options                   | Object  | Optional configuration for the Node Sass compiler.                          |
| options.useLegacyCompiler | Boolean | Flag that enables the Node Sass compiler instead of the Dart Sass compiler. |
| plugins                   | Object  | Optional plugins that will be assigned to the Postcss plugin.               |
| plugins.postcss           | Object  | The optional Postcss plugin(configuration).                                 |

### StyleguideHelper configuration

The StyleguideHelper creates initial Styleguide entry templates from the existing Twig templates any json or yaml file that is relative to the Twig template will be included within the styleguide entyr.

| Option                          | type        | Description                                                                                                                          |
| ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| options                         | Object      | Optional configuration for the worker.                                                                                               |
| options.configurationExtensions | String[]    | Includes the first configuration entry from the defined extensions, the configuration is found relative within the template context. |
| options.defaultModuleName       | String      | Defines the name for the default entry story.                                                                                        |
| options.destinationDirectory    | String/null | Writes the new entries to the defined directory or write it relative to the template by disabling this option.                       |
| options.disableAlias            | Boolean     | Don't use the included @theme alias and use a relative path instead.                                                                 |
| options.extname                 | String      | Use the defined extension when the styleguide entry is written to the FileSystem.                                                    |
| options.filterKeywords          | String[]    | Removes the defined keywords from the generated Module export, File paths won't be adjusted from this settings.                      |
| options.ignoreInitial           | Boolean     | Overwrites the existing entry files when enabled.                                                                                    |
| options.prettier                | Boolean     | Should implement your project prettier configuration to ensure the styleguide entries are written in the correct syntax.             |
| options.sep                     | String      | Defines the structure separator for the entry title.                                                                                 |
| options.structuredTitle         | Boolean     | Includes the base directory structure for the styleguide entries when enabled.                                                       |
| options.variants                | Object      | Includes optional module variants for the entry template.                                                                            |
| options.variants[].context      | String      | Should match with the file that is used for the variant configuration.                                                               |
| options.variants[].query        | String      | Executes a regular expression match within the defined context path, scripting files are ignored.                                    |
| options.variants[].transform    | Function    | Optional handler that will the matched query values.                                                                                 |


#### Define StyleguideHelper variants

You can define additional module variants for each entry template by defining additional
properties that will be used within the template scope:

```js
StyleguideHelper: {
  variants: {
    modifier_class: {
      query: /[^&(){}`a-zA-Z][.][a-zA-Z-]+--[a-zA-Z-]+/g,
      context: 'scss',
      transform: (v) => v.split('.').join(''),
    },
  },
}
```

The `query` option should match a regular expression that will match everything
within the given source file. This source file is based defined from the initial source file where the `from` option is used as file extension replacement:

```
src/example.twig => src/example.scss
```

A `transform` handler can be included in order to strip any unwanted character from the matched results within the regular expression.

You can also directly import the variant configuration if the defined context matches a `.js`, `.json`, `.mjs` or `.yaml` file. This will assign the extra properties to the defined variant:

```js
// Will create a variant as module import:
// import ButtonExampleConfiguration from button.example.json
// within the template context: button.twig.
StyleguideHelper: {
  variants: {
    modifier_class: {
      context: '.example.json',
    },
  },
}
```

It is also possible to search for configuration files outside the directory by including the `includeDirectories` option within the variant configuration.

Keep in mind that the directories are resolved from the defined `THEME_SRC` environment path. It will use the configuration if the file `config/{module}.example.json` exists:

```js
// Will create a variant as module import:
// import ButtonExampleConfiguration from button.example.json
// outside the template context: button.twig.
StyleguideHelper: {
  variants: {
    modifier_class: {
      context: '.example.json',
      includeDirectories: ['config'],
    },
  },
}
```

### SvgSpriteCompiler configuration

The SvgSpriteCompiler will compile the defined entries into inline SVG sprites.
The result will be written relative to the configured environment destination directory.

| Option | type   | Description                                             |
| ------ | ------ | ------------------------------------------------------- |
| prefix | String | The ID prefix for each icon within the compiled sprite. |

### Resolver configuration

The Resolver will resolve the defined packages from the node_modules to the environment destination.

| Option      | type   | Description                                                                |
| ----------- | ------ | -------------------------------------------------------------------------- |
| options.cwd | String | The destination directory where the resolved entries will be Written into. |



## 🧪 Experiments

The Backstop.js testing suite is currently experimental worker since the full potential has not yet been included within Harbor. You can currently generate Snapshot tests from a static Storybook environment and compare any mismatch. Keep in mind that you still need to implement other Testing suites when different test cases are required...


### StyleguideTester configuration

The StyleguideTester enables snapshot testing of the generated styleguide. All valid stories will be extracted by Storybook and are tested with [BackstopJS](https://github.com/garris/BackstopJS).

| Option                    | type   | Description                                                                                                          |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| options                   | Object | Optional configuration for the worker & BackstopJS.                                                                  |
| options.backstopJS        | Object | Defines the base configuration for BackstopJS. [More info](https://github.com/garris/BackstopJS#advanced-scenarios)  |
| options.outputPath        | String | The destination for the Styleguide manifest that is used for the Snapshot tester.                                    |
| options.scenarioDirectory | String | Defines the destination directory for additional scenarios defined as YAML or JSON file.                             |
| options.staticDirectory   | String | Defines the destination directory for the static styleguide build, to prevent removal of already generated packages. |


### Running Snapshot tests

It is possible to run Snapshot tests with BackstopJS for all created Storybook stories.
Storybook first generates a stories manifest in order to define the components to test.
A temporary Storybook instance will be created afterwards, which BackstopJS will use for the snapshot tests.

You need to enable reference snapshots first otherwise you will encounter an error, you need to pass the optional `test` parameter within the command:

```sh
$ harbor --task=test --test=reference
```

This will create reference snapshots within the defined `options.backstopJS.bitmaps_reference` configuration option.
These snapshots will tested with the defined testing snapshots afterwards:

```sh
# You don't need to define the `test` parameter since this is the default testing method.
$ harbor --task=test --test=test
```

An exception will be thrown if there are any mismatches with the references. You can approve these changes automatically by running:

```sh
$ harbor --task=test --test=approve
```
