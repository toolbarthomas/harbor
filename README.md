# Harbor

Harbor is an asset builder that fits within the theme architecture of [Drupal](https://drupal.org/) 8+ setups.
It can create [Drupal](https://drupal.org/) compatible themes without the need to install the actual CMS.
With the help of [Storybook](https://storybookjs.org/) it can generate the Twig templates that are used by Drupal themes.

The assets are processed on a very basic level, stylesheets can be compiled with the included compiler and Babel will transform the defined javascript files to enable JS compatibility for older browsers.

It is optional to use the bundled workers but they ensure that they work correctly within Drupal and your styleguide. It is possible to include other frameworks within the environment by simply adding it within a compatible theme library configuration.

## Setup

You can install Harbor via NPM ([Nodejs](https://nodejs.org) is required in order to do this.):

```sh
$ npm install @toolbarthomas/harbor
```

Then you can start Harbor by simply running:

```sh
$ node node_modules/@toolbarthomas/harbor/index.js
```

Harbor will run the default tasks when there are no CLI arguments defined for the initial command.
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

Installing Harbor globally will lock you in a specific version so keep in mind
it can break your workflow if you installed the newest version without fixing the breaking-changes.

```sh
$ harbor
# or
$ harbor --styleguide --watch
```

## Workers

A worker provides the core tasks for Harbor and can be adjusted within the configuration.
Workers can be initiated during a Harbor process by calling the defined hook within the command or as CLI argument.

```sh
# Starts the workers that have the stylesheets hook from the configuration.
$ node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets
$ node node_modules/@toolbarthomas/harbor/index.js stylesheets
```

This example will start the workers that are defined with the `stylesheets` hook, by default it will process the configured sass entry files (or it will try to use the default configured entries).

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
| Cleaner          | Cleans the defined THEME_DIST environment directory.                            | `Cleaner` `clean` `prepare` `default`                   |
| FileSync         | Synchronizes the defined entry files to the THEME_DIST environment directory.   | `FilSync` `sync` `prepare` `default`                    |
| JsCompiler       | Transforms the defined entry javascript files with Babel.                       | `JSCompiler` `js` `javascripts` `compile` `default`     |
| Resolver         | Resolves NPM installed vendor pacakges to the THEME_DIST environment directory. | `Resolver` `resolve` `prepare` `default`                |
| SassCompiler     | Compiles the defined entry Sass files with Node Sass.                           | `SassCompiler` `sass` `stylesheets` `compile` `default` |
| StyleguideHelper | Creates initial storybook entries from the defined Twig templates.              | `StyleguideHelper` `setup`                              |
| StyleguideTester | Initiates Snapshot tests for the styleguide with BackstopJS.                    | `StyleguideTester` `test`                               |
| SVSpriteCompiler | Creates one or more inline SVG sprites based from the configured entries.       | `SVGSpriteCompiler` `svg` `images` `compile` `default`  |

## Plugins

Plugins are used to run post-process tasks like starting the storybook development server, optimizing the assets or include a file watcher.
These can be defined by adding the given CLI argument hooks within your command:

```sh
$ node node_modules/@toolbarthomas/harbor/index.js --task=javascripts --minify
```

More plugins can be included within a single command, the following plugins are available within the default configuration, the result of certain plugins can vary between environments:

| Plugin             | Environment        | Description                                                                                 | Hook(s)               |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------- | --------------------- |
| JSOptimizer        | production `only`  | Minifies the defined js entries within the THEME_DIST directory                             | minify                |
| StyleOptimizer     | production `only`  | Minifies the defined css entries within the THEME_DIST directory                            | minify                |
| StyleguideCompiler | production         | Creates a static storybook styleguide.                                                      | storybook, styleguide |
| StyleguideCompiler | development        | Starts the storybook development server.                                                    | storybook, styleguide |
| Watcher            | development `only` | Watches the configured instance entries and runs the assigned workers during a file change. | watch                 |

This will only generate the actual assets that should be compatible for the Drupal environment.
Keep in mind that this command will only run the configured Harbor workers, the actual development tools can be included with extra CLI arguments:

```sh
$ node node_modules/@toolbarthomas/harbor/index.js --task=javascripts --minify --watch
```

## Environment

An optional Harbor environment can be defined by creating a [dotenv](https://www.npmjs.com/package/dotenv) file within the root of your theme directory.
The following configuration can be adjusted, the default values will be used for any missing environment variable.

| Environment variable   | Default value    | Description                                                                                                                                                  |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| THEME_SRC              | ./src            | Defines the working source directory for all Worker entries.                                                                                                 |
| THEME_DIST             | ./dist           | Defines the build directory for all Worker entries & the styleguide development server.                                                                      |
| THEME_PORT             | 8080             | Defines the server port for the styleguide development server.                                                                                               |
| THEME_DEBUG            | false            | Includes sourcemaps if the defined entries support it.                                                                                                       |
| THEME_ENVIRONMENT      | production       | Enables environment specific Plugins to be used.                                                                                                             |
| THEME_STATIC_DIRECTORY | storybook-static | Defines the destination path for the static styleguide build. This is used to create multiple static builds within the codebase.                             |
| THEME_WEBSOCKET_PORT   | 35729            | Enables attached library stylesheets to be automatically refreshed within the styleguide, the websocket won't be created if there is no port number defined. |
| THEME_TEST_PHASE       | test             | Defines the testing method for BackstopJS: `test`, `reference` or `approve`.                                                                                 |
| THEME_AS_CLI           | false            | Launches Storybook in CLI mode that is used by the StyleguideTester.                                                                                         |

## Default Configuration

The Harbor workers can be configured to point out the location of your assets. A default configuration has been defined within Harbor,
a custom configuration can be used by creating `harbor.config.js` within the working directory.

For example:

```js
  // harbor.config.js

  ...
  workers: {
    SassCompiler: {
      options: ...,
      hook: 'stylesheets',
      plugins: ...,
      entry: {
        main: [...]
      },
    },
  }
  ...
```

## Default Worker Configuration

### Cleaner configuration

The Cleaner is a default Harbor worker that will delete all files within the defined environment destination directory: `THEME_DIST`

| Option | type   | Description                                                          |
| ------ | ------ | -------------------------------------------------------------------- |
| hook   | String | Runs the worker if the given hook is subscribed to the Task Manager. |

### FileSync configuration

The FileSync will synchronize the defined static entries to the configured environment destination directory.

| Option   | type     | Description                                                                                   |
| -------- | -------- | --------------------------------------------------------------------------------------------- |
| patterns | String[] | Copies the given patterns and it's folder structure to the environment destination directory. |
| hook     | String   | Runs the worker if the given hook is subscribed to the Task Manager.                          |

### JsCompiler configuration

The JsCompiler transforms & lints the defined entries with Babel & Eslint.
The result will be written relative to the configured environment destination directory.

| Option            | type                   | Description                                                             |
| ----------------- | ---------------------- | ----------------------------------------------------------------------- |
| entry             | Object[String, String] | Transforms & lints the given entries with Babel & Eslint.               |
| hook              | String                 | Runs the worker if the given hook is subscribed to the Task Manager.    |
| plugins           | Object                 | Optional plugins that will be assigned to the Babel & Eslint instances. |
| plugins.eslint    | Object                 | The optional Eslint plugin(configuration).                              |
| plugins.transform | Object                 | The optional Babel transform(configuration).                            |

### SassCompiler configuration

The SassCompiler renders & prepares the defined entries with Node Sass & Postcss.
The result will be written relative to the configured environment destination directory.

| Option            | type                   | Description                                                                 |
| ----------------- | ---------------------- | --------------------------------------------------------------------------- |
| options           | Object                 | Optional configuration for the Node Sass compiler.                          |
| useLegacyCompiler | Boolean                | Flag that enables the Node Sass compiler instead of the Dart Sass compiler. |
| hook              | String                 | Runs the worker if the given hook is subscribed to the Task Manager.        |
| plugins           | Object                 | Optional plugins that will be assigned to the Postcss plugin.               |
| plugins.postcss   | Object                 | The optional Postcss plugin(configuration).                                 |
| entry             | Object[String, String] | Renders & lints the given entries with Node Sass & Postcss.                 |

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
| options.ignoreInitial           | Boolean     | Overwrites the existing entry files when enabled.                                                                                    |
| options.prettier                | Boolean     | Should implement your project prettier configuration to ensure the styleguide entries are written in the correct syntax.             |
| options.sep                     | String      | Defines the structure separator for the entry title.                                                                                 |
| options.structuredTitle         | Boolean     | Includes the base directory structure for the styleguide entries when enabled.                                                       |
| options.variants                | Object      | Includes optional module variants for the entry template.                                                                            |
| options.variants[].context      | String      | Should match with the file that is used for the variant configuration.                                                               |
| options.variants[].query        | String      | Executes a regular expression match within the defined context path, scripting files are ignored.                                    |
| options.variants[].transform    | Function    | Optional handler that will the matched query values.                                                                                 |
| hook                            | String      | Runs the worker if the given hook is subscribed to the Task Manager.                                                                 |

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

### StyleguideTester configuration

The StyleguideTester enables snapshot testing of the generated styleguide. All valid stories will be extracted by Storybook and are tested with [BackstopJS](https://github.com/garris/BackstopJS).

| Option                    | type   | Description                                                                                                          |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| options                   | Object | Optional configuration for the worker & BackstopJS.                                                                  |
| options.backstopJS        | Object | Defines the base configuration for BackstopJS. [More info](https://github.com/garris/BackstopJS#advanced-scenarios)  |
| options.staticDirectory   | String | Defines the destination directory for the static styleguide build, to prevent removal of already generated packages. |
| options.scenarioDirectory | String | Defines the destination directory for additional scenarios defined as YAML or JSON file.                             |
| options.outputPath        | String | The destination for the Styleguide manifest that is used for the Snapshot tester.                                    |
| hook                      | String | Runs the worker if the given hook is subscribed to the Task Manager.                                                 |

### SvgSpriteCompiler configuration

The SvgSpriteCompiler will compile the defined entries into inline SVG sprites.
The result will be written relative to the configured environment destination directory.

| Option  | type                   | Description                                                          |
| ------- | ---------------------- | -------------------------------------------------------------------- |
| entry   | Object[String, String] | Compiles the given entries with SvgStore.                            |
| options | Object                 | Optional configuration for the Sprite compiler.                      |
| hook    | String                 | Runs the worker if the given hook is subscribed to the Task Manager. |
| prefix  | String                 | The ID prefix for each icon within the compiled sprite.              |

### Resolver configuration

The Resolver will resolve the defined packages from the node_modules to the environment destination.

| Option | type                   | Description                                                          |
| ------ | ---------------------- | -------------------------------------------------------------------- |
| entry  | Object[String, String] | Resolves the given entry packages to the environment destination.    |
| hook   | String                 | Runs the worker if the given hook is subscribed to the Task Manager. |

## Default Plugin Configuration

### StyleguideCompiler configuration

The Styleguide Compiler will generate a new Storybook instance for the defined `THEME_ENVIRONMENT` value.

A Storybook development version can be launched by defining `THEME_ENVIRONMENT='development'` within your environment configuration.

This will launch a new Storybook development server with the Storybook CLI.
More information about the usage of this server can be found on [Storybook](https://storybook.js.org/docs)

You can also create a static version of your Storybook instance by setting `THEME_ENVIRONMENT` to `production`.
This static styleguide will be written to the defined `THEME_DEST` destination and will resolve the processed assets within the static package.
Keep in mind that some assets cannot be displayed when viewing the static HTML document directly for security reasons.

This can be resolved by viewing the actual result from a (local) webserver.

| Option                    | type                   | Description                                                                                                    |
| ------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| entry                     | Object[String, String] | Compiles the given entries with Storybook.                                                                     |
| options                   | Object                 | Optional configuration for the Storybook compiler.                                                             |
| options.alias             | Object                 | Assigns Babel module-resolver aliases to the Storybook instance.                                               |
| options.globalMode        | Boolean/String         | `experimental` This will use a global render context for Twig.                                                 |
| options.optimization      | Object                 | Defines the [Webpack optimization](https://webpack.js.org/configuration/optimization/) configuration.          |
| options.addons            | Array                  | Should contain the [Storybook addon](https://storybook.js.org/docs/react/addons/install-addons) configuration. |
| options.configDirectory   | String                 | Defines the Storybook instance directory for your theme: `./.storybook`.                                       |
| options.builderDirectory  | String                 | Defines the Twing instance directory `.twing` that can be used to include custom Twing functionality.          |
| options.staticDirectory   | String                 | Defines the destination path for the `production` build of the Storybook styleguide `storybook-static`.        |
| options.useLegacyCompiler | Boolean                | Enables the usage of older Twing libraries within the styleguide to disable the requirement of async stories.  |
| hook                      | String                 | Runs the worker if the given hook is subscribed to the Task Manager.                                           |

### Watcher configuration

The Watcher can be started by defining the `watch` parameter to the CLI and will run the defined hooks from the TaskManager.
The Watcher will shutdown automatically if no event occured during the defined duration.

| Option              | type                   | Description                                                                             |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| options             | Object                 | Optional configuration for the Watcher class.                                           |
| options.delay       | number                 | Creates a timeout before running the connected Workers after a Watch event has occured. |
| options.duration    | number                 | Defines the lifetime in miliseconds of the spawned Watcher instances.                   |
| instances           | Object[String, Object] | Spawns a Wacther instance for each defined entry.                                       |
| instances[].event   | String                 | Defines the Event handler and will publish the defined hook with the TaskManager.       |
| instances[].path    | String/String[]        | Watches the given paths for the spawned Watcher.                                        |
| instances[].workers | String[]               | Will publish the defined Harbor workers in order.                                       |

## Example NPM script setup

You can assign the following NPM script entries when using the default hook configuration:

```js
  {
    "production": "node node_modules/@toolbarthomas/harbor/index.js --task=prepare,compile --minify",
    "predevelopment": "npm run production",
    "development": "node node_modules/@toolbarthomas/harbor/index.js --watch --styleguide",
    "images": "node node_modules/@toolbarthomas/harbor/index.js --task=images",
    "javascripts": "node node_modules/@toolbarthomas/harbor/index.js --task=javascripts",
    "resolve": "node node_modules/@toolbarthomas/harbor/index.js --task=resolve",
    "serve": "node node_modules/@toolbarthomas/harbor/index.js --serve",
    "styleguide": "node node_modules/@toolbarthomas/harbor/index.js --styleguide",
    "stylesheets": "node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets",
    "test": "node node_modules/@toolbarthomas/harbor/index.js --task=test",
  }
```

### Asset management

Assets can be included by using the [attach_library](https://www.drupal.org/docs/theming-drupal/adding-stylesheets-css-and-javascript-js-to-a-drupal-theme) Twig function within your templates.

Stylesheets that are injected from the `attach_library` function will also refresh during a file change.

You need a valid Drupal theme library configuration file within your theme with the defined resources you want to use within the theme:

```yml
# example.libraries.yml
base:
  version: 1.x
  css:
    base:
      dist/main/stylesheets/index.css: {}
  js:
    dist/main/javascripts/base.js: {}
```

The defined assets will be included within the templates that uses the `attach_library` Twig function:

```twig

{{ attach_library('example/base') }}

```

It also possible to use the defined Storybook preview head & body snippets within your project. Harbor will copy the configuration files from the defined `configDirectory` option within the `StyleguideCompiler` plugin ('./storybook').

You can also import the actual assets within each storybook story to enable Hot Module Reload. Keep in mind that you still need to define the required libraries within Drupal if you don't include assets with the `attach_library` function.

```js
// example.stories.js

import styles from './styles.css';

...
```

### Suggested javascript structure.

Using the functionality of the Drupal.behaviors Object, you can run the defined javascript during the (initial) (re)load within Drupal and Storybook.
Storybook calls the attach handler within the Drupal behaviors, this Object is used within Drupal sites and is also available for the styleguide.

The actual javascript can be created like the following and should be compliant with the Drupal javascript structure:

```js
  (function example(Drupal) {
    Drupal.behaviors.example = {
      attach: (context, settings) => {
        ...
      }
    }
  })(Drupal, drupalSettings);
```

### Implementing templates since >=1.0.0

As of version 1.0.0 you need to define your Twing templates within the Storybook `loaders` configuration. This is required in order to display the actual templates; since they are rendered in asynchronous order:

```js
// example.stories.js

import Template from 'template.twig';

export default {
  title: 'Example template',
  loaders: [
    async ({ args }) => {
      Template: await Template(args); // Keyname can be anything.
    },
  ],
};

// loaded.Templates is defined within the default default export.
export const Default = (args, { loaded }) = > loaded.Template;

// Define the actual arguments
Default.args = {
  title: 'Foo',
};
```

```twig
{{ title }}
```

### Usage of SVG Inline Sprites

Harbor compiles the defined SVG images with the SVGSpriteCompiler and these can be used within the Twig templates. The sprites are available as a Storybook Global that can be accessed within the styleguide.

You can easily include these paths with the `add_svg` Twig function. This will output the path of an inline SVG sprite that has been created by the SVGSpriteCompiler. This function accepts 3 arguments to output the path of your selection:

```twig
{{ add_svg('svg--chevron--down') }}
```

This will include the path of the SVG sprite based from the first inline svg that has been stored within the `THEME_SPRITES` storybook global.
This would output `dist/main/images/svgsprite.svg#svg--chevron--down` if the entry key would be defined as `svgsprite`...

You can use any entry key of the SVGSpriteCompiler configuration to use that specific sprite path instead:

```js
  // harbor.config.js

  workers: {
    ...
      SvgSpriteCompiler: {
        ...
        entry: {
          common: 'main/images/common/**.svg',
          icons: 'main/images/icons/**.svg',
        },
        ...
    ...
  }
```

```twig
{{ add_svg('svg--chevron--down', 'icons') }}
```

This will output `dist/main/images/icons.svg#svg--chevron--down`.

It is also possible to output the base SVG element when the second or third argument has been defined as `true`:

```twig
{{ add_svg('svg--logo', true) }}
```

Would output:

```html
<svg aria-hidden="true" aria-focusable="false">
  <use xlink:href="dist/main/images/common.svg#svg--logo"></use>
</svg>
```

And:

```twig
  {{ add_svg('svg--chevron--down', 'icons', true) }}
```

Will render:

```xml
<svg aria-hidden="true" aria-focusable="false">
  <use xlink:href="dist/main/images/icons.svg#svg--chevron--down"></use>
</svg>
```

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
