# Harbor

Harbor is an Asset Builder that will help you to develop [Drupal](http://drupal.org/) compliant front-end resources that is based on the Twig templating Engine.

Each twig template should work within your configured Drupal Environment and you should use this tool directly within your custom theme. Harbor has also the option to view these templates directly within [Storybook](https://storybook.js.org/) so you can also develop your theme outside Drupal.

## Environment

An optional Harbor environment can be defined by creating a [dotenv](https://www.npmjs.com/package/dotenv) file within the root of your theme directory.
The default configuration values will be used when missing:

```shell
  THEME_SRC=./src # Defines the assets working source directory.
  THEME_DIST=./dist # Defines the asset destination directory.
  THEME_PORT=8080 # Defines the server port for the served Styleguide.
  THEME_ENVIRONMENT=production # Optmizes the flow for the current environment.
```

## Default Configuration

The Harbor services can be configured to point out the location of you assets. A default configuration has been defined within Harbor.
A default configuration can be used by creating `harbor.config.js` within the working directory.

For example:

```js
  // harbor.config.js

  ...
  SassCompiler: {
    options: ...,
    hook: 'stylesheets',
    plugins: ...,
    entry: {
      main: [...]
    },
  },
  ...
```

### Cleaner Options

The Cleaner is a default Harbor service that will delete all files within the defined environment destination directory: `THEME_DIST`

| Option | type   | Description                                                           |
| ------ | ------ | --------------------------------------------------------------------- |
| hook   | string | Runs the service if the given hook is subscribed to the Task Manager. |

### FileSync Options

The FileSync will synchronize the defined static entries to the configured environment destination directory.

| Option   | type     | Description                                                                                   |
| -------- | -------- | --------------------------------------------------------------------------------------------- |
| patterns | string[] | Copies the given patterns and it's folder structure to the environment destination directory. |
| hook     | string   | Runs the service if the given hook is subscribed to the Task Manager.                         |

### JsCompiler Options

The JsCompiler transforms & lints the defined entries with Babel & Eslint.
The result will be written relative to the configured environment destination directory.

| Option            | type                   | Description                                                             |
| ----------------- | ---------------------- | ----------------------------------------------------------------------- |
| entry             | Object[string, string] | Transforms & lints the given entries with Babel & Eslint.               |
| hook              | string                 | Runs the service if the given hook is subscribed to the Task Manager.   |
| plugins           | Object                 | Optional plugins that will be assigned to the Babel & Eslint instances. |
| plugins.eslint    | Object                 | The optional Eslint plugin(configuration).                              |
| plugins.transform | Object                 | The optional Babel transform(configuration).                            |

### SassCompiler Options

The SassCompiler renders & prepares the defined entries with Node Sass & Postcss.
The result will be written relative to the configured environment destination directory.

| Option          | type                   | Description                                                           |
| --------------- | ---------------------- | --------------------------------------------------------------------- |
| options         | Object                 | Optional configuration for the Node Sass compiler.                    |
| hook            | string                 | Runs the service if the given hook is subscribed to the Task Manager. |
| plugins         | Object                 | Optional plugins that will be assigned to the Postcss plugin.         |
| plugins.postcss | Object                 | The optional Postcss plugin(configuration).                           |
| entry           | Object[string, string] | Renders & lints the given entries with Node Sass & Postcss.           |

### Server Options

The Server is the legacy Express server that should be used if you wan't to serve the result of the destination directory. The should be ignored if Storybook is the chosen styleguide.

| Option  | type   | Description                                                           |
| ------- | ------ | --------------------------------------------------------------------- |
| options | Object | Optional configuration for the Express server.                        |
| hook    | string | Runs the service if the given hook is subscribed to the Task Manager. |

### StyleguideCompiler options

The Styleguide Compiler will generate a new Storybook instance that can be accesed on the configured environment port.

| Option  | type                   | Description                                                           |
| ------- | ---------------------- | --------------------------------------------------------------------- |
| entry   | Object[string, string] | Compiles the given entries with Storybook.                            |
| options | Object                 | Optional configuration for the Storybook compiler.                    |
| hook    | string                 | Runs the service if the given hook is subscribed to the Task Manager. |

### SvgSpriteCompiler options

The SvgSpriteCompiler will compile the defined entries into inline SVG sprites.
The result will be written relative to the configured environment destination directory.

| Option  | type                   | Description                                                           |
| ------- | ---------------------- | --------------------------------------------------------------------- |
| entry   | Object[string, string] | Compiles the given entries with SvgStore.                             |
| options | Object                 | Optional configuration for the Sprite compiler.                       |
| hook    | string                 | Runs the service if the given hook is subscribed to the Task Manager. |
| prefix  | string                 | The ID prefix for each icon within the compiled sprite.               |

### Resolver options

The Resolver will resolve the defined packages from the node_modules to the environment destination.

| Option | type                   | Description                                                           |
| ------ | ---------------------- | --------------------------------------------------------------------- |
| entry  | Object[string, string] | Resolves the given entry packages to the environment destination.     |
| hook   | string                 | Runs the service if the given hook is subscribed to the Task Manager. |

### Watcher options

The Watcher can be used during the development process and will run the configured hooks with the TaskManager.
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

## Setup

Harbor can be included directly within your custom node script:

```js
// index.js

const Harbor = require('@toolbarthomas/harbor');
const instance = new Harbor();

instance.init();
```

You can run one or multiple tasks by defining the `task` parameter.
Keep in mind that the hook should exist within your configuration:

```
  $ node ./index.js task=sync
```

You can assign the following NPM script entries when using the default hook configuration:

```js
  {
    "prebuild": "node ./index.js task=prepare",
    "build": "node ./index.js task=stylesheets,javascripts,images",
    "predevelop": "npm run build",
    "develop": "node ./index.js task=watch,styleguide",
    "images": "node ./index.js task=images",
    "javascripts": "node ./index.js task=javascripts",
    "resolve": "node ./index.js task=resolve",
    "serve": "node ./index.js task=serve",
    "styleguide": "node ./index.js task=styleguide",
    "stylesheets": "node ./index.js task=stylesheets",
    "watch": "node ./index.js task=watch",
  }
```

The default hooks are: `prepare`, `javascripts`, `stylesheets`, `serve`, `styleguide`, `images`
It is also possible to use the Service name directly:

```
node ./index.js task=SassCompiler
```
