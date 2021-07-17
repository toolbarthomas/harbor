# Harbor

Harbor is an asset builder that fits within the theme architecture of [Drupal](https://drupal.org/) 8+ setups.
It can create [Drupal](https://drupal.org/) compatible themes without the need to install the actual CMS.
With the help of [Storybook](https://storybookjs.org/) it can generate the Twig templates that are used by Drupal themes.

The assets are processed on a very basic level, stylesheets files can be compiled with the included compiler and Babel will transform the defined javascript files to enable JS compatibility for older browsers.

It does not care about any frameworks and you can include additional plugins for the configured workers.

## Setup

You can install Harbor via NPM (we assume you have installed [Nodejs](https://nodejs.org):

```
$ npm install @toolbarthomas/harbor
```

Then you can start Harbor by simply running:

```
$ node node_modules/@toolbarthomas/harbor/index.js
```

Additional CLI arguments can be defined to customize the build process:

| Argument   | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| task       | Starts one or more worker tasks to compile the theme assets. |
| styleguide | Starts the Storybook builder.                                |
| watch      | Observes for file changes for the running tasks.             |
| minify     | Minifies the processed assets.                               |

## Workers

A worker provides the core tasks for Harbor and can be adjusted within the configuration.
Workers can be initiated during a Harbor process by calling the defined hook within the command or as CLI argument.

```shell
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

The actual workers that share the same hook without the double colon flag will run in a parallel order:

```shell
$ node node_modules/@toolbarthomas/harbor/index.js --task=compile
```

The following workers are configured within the default configuration:

| Worker           | Description                                                                     | Hook(s)                                       |
| ---------------- | ------------------------------------------------------------------------------- | --------------------------------------------- |
| Cleaner          | Cleans the defined THEME_DIST environment directory.                            | `Cleaner` `clean` `prepare`                   |
| FileSync         | Synchronizes the defined entry files to the THEME_DIST environment directory.   | `FilSync` `sync` `prepare`                    |
| JsCompiler       | Transforms the defined entry javascript files with Babel.                       | `JSCompiler` `js` `javascripts` `compile`     |
| Resolver         | Resolves NPM installed vendor pacakges to the THEME_DIST environment directory. | `Resolver` `resolve` `prepare`                |
| SassCompiler     | Compiles the defined entry Sass files with Node Sass.                           | `SassCompiler` `sass` `stylesheets` `compile` |
| SVSpriteCompiler | Creates one or more inline SVG sprites based from the configured entries.       | `SVGSpriteCompiler` `svg` `images` `compile`  |

## Plugins

Plugins are used to run post-process tasks like starting the storybook development server, optimizing the assets or include a file watcher.
These can be defined by adding the given CLI argument hooks within your command:

```shell
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

```shell
$ node node_modules/@toolbarthomas/harbor/index.js --task=javascripts --minify --watch
```

## Environment

An optional Harbor environment can be defined by creating a [dotenv](https://www.npmjs.com/package/dotenv) file within the root of your theme directory.
The following configuration can be adjusted, the default values will be used for any missing environment variable.

| Environment variable | Default value | Description                                                                                                                                                  |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| THEME_SRC            | ./src         | Defines the working source directory for all Worker entries.                                                                                                 |
| THEME_DIST           | ./dist        | Defines the build directory for all Worker entries & the styleguide development server.                                                                      |
| THEME_PORT           | 8080          | Defines the server port for the styleguide development server.                                                                                               |
| THEME_ENVIRONMENT    | production    | Defines the server port for the styleguide development server.                                                                                               |
| THEME_DEBUG          | false         | Includes sourcemaps if the defined entries support it.                                                                                                       |
| THEME_WEBSOCKET_PORT | 35729         | Enables attached library stylesheets to be automatically refreshed within the styleguide, the websocket won't be created if there is no port number defined. |

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
| hook   | string | Runs the worker if the given hook is subscribed to the Task Manager. |

### FileSync configuration

The FileSync will synchronize the defined static entries to the configured environment destination directory.

| Option   | type     | Description                                                                                   |
| -------- | -------- | --------------------------------------------------------------------------------------------- |
| patterns | string[] | Copies the given patterns and it's folder structure to the environment destination directory. |
| hook     | string   | Runs the worker if the given hook is subscribed to the Task Manager.                          |

### JsCompiler configuration

The JsCompiler transforms & lints the defined entries with Babel & Eslint.
The result will be written relative to the configured environment destination directory.

| Option            | type                   | Description                                                             |
| ----------------- | ---------------------- | ----------------------------------------------------------------------- |
| entry             | Object[string, string] | Transforms & lints the given entries with Babel & Eslint.               |
| hook              | string                 | Runs the worker if the given hook is subscribed to the Task Manager.    |
| plugins           | Object                 | Optional plugins that will be assigned to the Babel & Eslint instances. |
| plugins.eslint    | Object                 | The optional Eslint plugin(configuration).                              |
| plugins.transform | Object                 | The optional Babel transform(configuration).                            |

### SassCompiler configuration

The SassCompiler renders & prepares the defined entries with Node Sass & Postcss.
The result will be written relative to the configured environment destination directory.

| Option          | type                   | Description                                                          |
| --------------- | ---------------------- | -------------------------------------------------------------------- |
| options         | Object                 | Optional configuration for the Node Sass compiler.                   |
| hook            | string                 | Runs the worker if the given hook is subscribed to the Task Manager. |
| plugins         | Object                 | Optional plugins that will be assigned to the Postcss plugin.        |
| plugins.postcss | Object                 | The optional Postcss plugin(configuration).                          |
| entry           | Object[string, string] | Renders & lints the given entries with Node Sass & Postcss.          |

### SvgSpriteCompiler configuration

The SvgSpriteCompiler will compile the defined entries into inline SVG sprites.
The result will be written relative to the configured environment destination directory.

| Option  | type                   | Description                                                          |
| ------- | ---------------------- | -------------------------------------------------------------------- |
| entry   | Object[string, string] | Compiles the given entries with SvgStore.                            |
| options | Object                 | Optional configuration for the Sprite compiler.                      |
| hook    | string                 | Runs the worker if the given hook is subscribed to the Task Manager. |
| prefix  | string                 | The ID prefix for each icon within the compiled sprite.              |

### Resolver configuration

The Resolver will resolve the defined packages from the node_modules to the environment destination.

| Option | type                   | Description                                                          |
| ------ | ---------------------- | -------------------------------------------------------------------- |
| entry  | Object[string, string] | Resolves the given entry packages to the environment destination.    |
| hook   | string                 | Runs the worker if the given hook is subscribed to the Task Manager. |

## Default Plugin Configuration

### StyleguideCompiler configuration

The Styleguide Compiler will generate a new Storybook instance that can be accesed on the configured environment port.

| Option  | type                   | Description                                                          |
| ------- | ---------------------- | -------------------------------------------------------------------- |
| entry   | Object[string, string] | Compiles the given entries with Storybook.                           |
| options | Object                 | Optional configuration for the Storybook compiler.                   |
| hook    | string                 | Runs the worker if the given hook is subscribed to the Task Manager. |

### Watcher configuration

The Watcher can be started by defining the `watch` parameter to the CLI and will run the defined hooks from the TaskManager.
The Watcher will shutdown automatically if no event occured during the defined duration.

| Option              | type                   | Description                                                                             |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| options             | Object                 | Optional configuration for the Watcher class.                                           |
| options.delay       | number                 | Creates a timeout before running the connected Workers after a Watch event has occured. |
| options.duration    | number                 | Defines the lifetime of the spawned Watcher instances.                                  |
| instances           | Object[string, object] | Spawns a Wacther instance for each defined entry.                                       |
| instances[].event   | string                 | Defines the Event handler and will publish the defined hook with the TaskManager.       |
| instances[].path    | string/string[]        | Watches the given paths for the spawned Watcher.                                        |
| instances[].workers | string[]               | Will publish the defined Harbor workers in order.                                       |

## Example NPM script setup

You can assign the following NPM script entries when using the default hook configuration:

```js
  {
    "preproduction": "node node_modules/@toolbarthomas/harbor/index.js --task=prepare",
    "production": "node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets,javascripts,images",
    "predevelopment": "npm run production",
    "development": "node node_modules/@toolbarthomas/harbor/index.js watch --task=styleguide",
    "images": "node node_modules/@toolbarthomas/harbor/index.js --task=images",
    "javascripts": "node node_modules/@toolbarthomas/harbor/index.js --task=javascripts",
    "resolve": "node node_modules/@toolbarthomas/harbor/index.js --task=resolve",
    "serve": "node node_modules/@toolbarthomas/harbor/index.js --task=serve",
    "styleguide": "node node_modules/@toolbarthomas/harbor/index.js --task=styleguide",
    "stylesheets": "node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets",
    "test": "echo \"Error: no test specified\" && exit 1"
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

Using the functionality of the Drupal.behaviors object, you can run the defined javascript during the (initial) (re)load within Drupal and Storybook.
Storybook calls the attach handler within the Drupal behaviors, this object is used within Drupal sites and is also available for the styleguide.

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

### Usage of SVG Inline Sprites

Harbor compiles the defined SVG images with the SVGSpriteCompiler and these can be used within the Twig templates. The sprites are available as a Storybook Global that can be accessed within the styleguide.

You can easily include these paths with the `add_svg` Twig function. This will output the path of an inline SVG sprite that has been created by the SVGSpriteCompiler. This function accepts 3 arguments to output the path of your selection:

```twig
{{ add_svg('chevron--down') }}
```

This will include the path of the SVG sprite based from the first inline svg that has been stored within the `THEME_SPRITES` storybook global.
This would output `dist/main/images/svgsprite.svg#chevron--down` if the entry key would be defined as `svgsprite`...

You can use any entry key of the SVGSpriteCompiler configuration to use that specific sprite path instead:

```js
  // harbor.config.js

  workers: {
    ...
      SvgSpriteCompiler: {
        ...
        entry: {
          common: 'main/images/common/*/**.svg',
          icons: 'main/images/icons/*/**.svg',
        },
        ...
    ...
  }
```

```twig
{{ add_svg('chevron--down', 'icons') }}
```

This will output `dist/main/images/icons/icons.svg#chevron--down`.

It is also posible to output the basis SVG element if the second or third argument has been defined as `TRUE`:

```twig
{{ add_svg('chevron--down', true) }}
```

Would output:

```html
<svg aria-hidden="true" aria-focusable="false">
  <use xlink:href="dist/main/images/icons.svg#chevron--down"></use>
</svg>
```
