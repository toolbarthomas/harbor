# Harbor

Harbor is an asset builder that fits within the theme architecture of [Drupal](https://drupal.org/) 8+ setups.
It can be used to easily create a [Drupal](https://drupal.org/) compatible theme without the need to install the actual CMS.
With the help of [Storybook](https://storybookjs.org/) it can generate the Twig templates that Drupal uses for it's templating system.

The assets are processed on a very basic level, sass files can be compiled with the included `Sasscompiler` and Babel will transform the defined javascript files to enable JS compatibility for older browsers. It does not care about any frameworks and you can include additional plugins for the configured workers.

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
| serve      | Starts the legacy browsersync server.                        |

You can run one or multiple tasks by defining the `task` parameter.
Keep in mind that the hook should exist within your configuration:
The default hooks are: `prepare`, `javascripts`, `stylesheets`, `serve`, `styleguide`, `images`

## Workers

The tasks (a.k.a. workers) are assigned to the `task` CLI argument, by defining this argument you can run one or multiple tasks, this can come in handy during the development stage.
All of the configured workers will be initiated if the task argument has not been defined, one or multiple tasks can be started from the CLI:

```shell
# Starts the workers that have the stylesheets hook from the configuration.
$ node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets
```

This example will start the workers that are defined with the `stylesheets` hook, by default it will process the configured sass entry files (or it will try to use the default configured entries).
Multiple tasks can be started within a single command by adding the required hooks with comma separations:

```shell
# Will process the stylesheets & javascript services in a paralell order.
$ node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets,javascripts
```

The following workers are configured within the default configuration:

| Worker           | Description                                                                     | Hook(s)                 |
| ---------------- | ------------------------------------------------------------------------------- | ----------------------- |
| Cleaner          | Cleans the defined THEME_DIST environment directory.                            | Cleaner, prepare        |
| FileSync         | Synchronizes the defined entry files to the THEME_DIST environment directory.   | FilSync, prepare        |
| JsCompiler       | Transforms the defined entry javascript files with Babel.                       | JSCompiler, javascripts |
| Resolver         | Resolves NPM installed vendor pacakges to the THEME_DIST environment directory. | Resolver, prepare       |
| SassCompiler     | Compiles the defined entry Sass files with Node Sass.                           | styleguide              |
| SVSpriteCompiler | Creates one or more inline SVG sprites based from the configured entries.       | images                  |

## Plugins

Plugins are used to run post-process tasks like starting the storybook development server, optimizing the assets or include a file watcher.
These can be defined by adding the given CLI argument hooks within your command:

```shell
$ node node_modules/@toolbarthomas/harbor/index.js --task=javascripts --minify
```

More plugins can be included within a single command, the following plugins are available within the default configuration, the result of certain plugins can vary between environments:

| Plugin             | Environment        | Description                                                                                 | Hook       |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------- | ---------- |
| JSOptimizer        | production `only`  | Minifies the defined js entries within the THEME_DIST directory                             | minify     |
| StyleOptimizer     | production `only`  | Minifies the defined css entries within the THEME_DIST directory                            | minify     |
| Server             | development `only` | Starts the legacy development server                                                        | serve      |
| StyleguideCompiler | production         | Creates a static storybook styleguide.                                                      | styleguide |
| StyleguideCompiler | development        | Starts the storybook development server.                                                    | styleguide |
| Watcher            | development `only` | Watches the configured instance entries and runs the assigned workers during a file change. | watch      |

This will only generate the actual assets that should be compatible for the Drupal environment.
Keep in mind that this command will only run the configured Harbor workers, the actual development tools can be included with extra CLI arguments:

```shell
$ node node_modules/@toolbarthomas/harbor/index.js --task=javascripts --minify --watch
```

## Environment

An optional Harbor environment can be defined by creating a [dotenv](https://www.npmjs.com/package/dotenv) file within the root of your theme directory.
The following configuration can be adjusted, the default values will be used for any missing environment variable.

| Environment variable | Default value | Description                                                                             |
| -------------------- | ------------- | --------------------------------------------------------------------------------------- |
| THEME_SRC            | ./src         | Defines the working source directory for all Worker entries.                            |
| THEME_DIST           | ./dist        | Defines the build directory for all Worker entries & the styleguide development server. |
| THEME_PORT           | 8080          | Defines the server port for the styleguide development server.                          |
| THEME_ENVIRONMENT    | production    | Defines the server port for the styleguide development server.                          |
| THEME_DEBUG          | false         | Includes sourcemaps if the defined entries support it.                                  |

## Default Configuration

The Harbor services can be configured to point out the location of your assets. A default configuration has been defined within Harbor,
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

The Cleaner is a default Harbor service that will delete all files within the defined environment destination directory: `THEME_DIST`

| Option | type   | Description                                                           |
| ------ | ------ | --------------------------------------------------------------------- |
| hook   | string | Runs the service if the given hook is subscribed to the Task Manager. |

### FileSync configuration

The FileSync will synchronize the defined static entries to the configured environment destination directory.

| Option   | type     | Description                                                                                   |
| -------- | -------- | --------------------------------------------------------------------------------------------- |
| patterns | string[] | Copies the given patterns and it's folder structure to the environment destination directory. |
| hook     | string   | Runs the service if the given hook is subscribed to the Task Manager.                         |

### JsCompiler configuration

The JsCompiler transforms & lints the defined entries with Babel & Eslint.
The result will be written relative to the configured environment destination directory.

| Option            | type                   | Description                                                             |
| ----------------- | ---------------------- | ----------------------------------------------------------------------- |
| entry             | Object[string, string] | Transforms & lints the given entries with Babel & Eslint.               |
| hook              | string                 | Runs the service if the given hook is subscribed to the Task Manager.   |
| plugins           | Object                 | Optional plugins that will be assigned to the Babel & Eslint instances. |
| plugins.eslint    | Object                 | The optional Eslint plugin(configuration).                              |
| plugins.transform | Object                 | The optional Babel transform(configuration).                            |

### SassCompiler configuration

The SassCompiler renders & prepares the defined entries with Node Sass & Postcss.
The result will be written relative to the configured environment destination directory.

| Option          | type                   | Description                                                           |
| --------------- | ---------------------- | --------------------------------------------------------------------- |
| options         | Object                 | Optional configuration for the Node Sass compiler.                    |
| hook            | string                 | Runs the service if the given hook is subscribed to the Task Manager. |
| plugins         | Object                 | Optional plugins that will be assigned to the Postcss plugin.         |
| plugins.postcss | Object                 | The optional Postcss plugin(configuration).                           |
| entry           | Object[string, string] | Renders & lints the given entries with Node Sass & Postcss.           |

### SvgSpriteCompiler configuration

The SvgSpriteCompiler will compile the defined entries into inline SVG sprites.
The result will be written relative to the configured environment destination directory.

| Option  | type                   | Description                                                           |
| ------- | ---------------------- | --------------------------------------------------------------------- |
| entry   | Object[string, string] | Compiles the given entries with SvgStore.                             |
| options | Object                 | Optional configuration for the Sprite compiler.                       |
| hook    | string                 | Runs the service if the given hook is subscribed to the Task Manager. |
| prefix  | string                 | The ID prefix for each icon within the compiled sprite.               |

### Resolver configuration

The Resolver will resolve the defined packages from the node_modules to the environment destination.

| Option | type                   | Description                                                           |
| ------ | ---------------------- | --------------------------------------------------------------------- |
| entry  | Object[string, string] | Resolves the given entry packages to the environment destination.     |
| hook   | string                 | Runs the service if the given hook is subscribed to the Task Manager. |

## Default Plugin Configuration

### Server Options

The Server is the legacy Express server that should be used if you wan't to serve the result of the destination directory. The should be ignored if Storybook is the chosen styleguide.

| Option  | type   | Description                                                           |
| ------- | ------ | --------------------------------------------------------------------- |
| options | Object | Optional configuration for the Express server.                        |
| hook    | string | Runs the service if the given hook is subscribed to the Task Manager. |

### StyleguideCompiler configuration

The Styleguide Compiler will generate a new Storybook instance that can be accesed on the configured environment port.

| Option  | type                   | Description                                                           |
| ------- | ---------------------- | --------------------------------------------------------------------- |
| entry   | Object[string, string] | Compiles the given entries with Storybook.                            |
| options | Object                 | Optional configuration for the Storybook compiler.                    |
| hook    | string                 | Runs the service if the given hook is subscribed to the Task Manager. |

### Watcher configuration

The Watcher can be started by defining the `watch` parameter to the CLI and will run the defined hooks from the TaskManager.
The Watcher will shutdown automatically if no event occured during the defined duration.

| Option               | type                   | Description                                                                             |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| options              | Object                 | Optional configuration for the Watcher class.                                           |
| options.delay        | number                 | Creates a timeout before running the connected Service after a Watch event has occured. |
| options.duration     | number                 | Defines the lifetime of the spawned Watcher instances.                                  |
| instances            | Object[string, object] | Spawns a Wacther instance for each defined entry.                                       |
| instances[].event    | string                 | Defines the Event handler and will publish the defined hook with the TaskManager.       |
| instances[].path     | string/string[]        | Watches the given paths for the spawned Watcher.                                        |
| instances[].services | string[]               | Will publish the defined Harbor services in order.                                      |

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
