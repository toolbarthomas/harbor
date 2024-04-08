# Harbor Plugins

Plugins are used to run post-process tasks like starting the storybook development server, optimizing the assets or include a file watcher.
These can be defined by adding the given CLI argument hooks within your command:

```sh
$ node node_modules/@toolbarthomas/harbor/index.js --task=javascripts --minify
```

## 🔌 Default Plugins

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

## ⚙️ Plugin configuration

### AssetExporter configuration

The AssetExporter wraps the defined entry templates as a valid module export template literal.
It is possible to include an optional literal function within the actual asset by defining a new `includeLiteral` Object within the options.

| Option                          | type   | Description                                                                                        |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| options                         | Object | Optional configuration for the AssetExporter.                                                      |
| options.includeLiteral          | Object | Assigns Babel module-resolver aliases to the Storybook instance.                                   |
| options.includeLiteral[].entry  | String | Should match with the defined entry name, a custom literal will be included when there is a match. |
| options.includeLiteral[].export | String | The actual literal that can be prefixed with.                                                      |
| options.includeLiteral[].import | String | The actual import source for the optional module literal.                                          |

### StyleguideCompiler configuration

The Styleguide Compiler will generate a new Storybook instance for the defined `THEME_ENVIRONMENT` value.

A Storybook development version can be launched by defining `THEME_ENVIRONMENT='development'` within your environment configuration.

This will launch a new Storybook development server with the Storybook CLI.
More information about the usage of this server can be found on [Storybook](https://storybook.js.org/docs)

You can also create a static version of your Storybook instance by setting `THEME_ENVIRONMENT` to `production`.
This static styleguide will be written to the defined `THEME_DEST` destination and will resolve the processed assets within the static package.
Keep in mind that some assets cannot be displayed when viewing the static HTML document directly for security reasons.

This can be resolved by viewing the actual result from a (local) webserver.

| Option                    | type           | Description                                                                                                    |
| ------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| options                   | Object         | Optional configuration for the Storybook compiler.                                                             |
| options.addons            | Array          | Should contain the [Storybook addon](https://storybook.js.org/docs/react/addons/install-addons) configuration. |
| options.alias             | Object         | Assigns Babel module-resolver aliases to the Storybook instance.                                               |
| options.builderDirectory  | String         | Defines the Twing instance directory `.twing` that can be used to include custom Twing functionality.          |
| options.configDirectory   | String         | Defines the Storybook instance directory for your theme: `./.storybook`.                                       |
| options.globalMode        | Boolean/String | `experimental` This will use a global render context for Twig.                                                 |
| options.optimization      | Object         | Defines the [Webpack optimization](https://webpack.js.org/configuration/optimization/) configuration.          |
| options.staticDirectory   | String         | Defines the destination path for the `production` build of the Storybook styleguide `storybook-static`.        |
| options.useLegacyCompiler | Boolean        | Enables the usage of older Twing libraries within the styleguide to disable the requirement of async stories.  |

### Watcher configuration

The Watcher can be started by defining the `watch` parameter to the CLI and will run the defined hooks from the TaskManager.
The Watcher will shutdown automatically if no event occured during the defined duration.

| Option              | type                   | Description                                                                             |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| instances           | Object[String, Object] | Spawns a Wacther instance for each defined entry.                                       |
| instances[].event   | String                 | Defines the Event handler and will publish the defined hook with the TaskManager.       |
| instances[].path    | String/String[]        | Watches the given paths for the spawned Watcher.                                        |
| instances[].workers | String[]               | Will publish the defined Harbor workers in order.                                       |
| options             | Object                 | Optional configuration for the Watcher class.                                           |
| options.delay       | number                 | Creates a timeout before running the connected Workers after a Watch event has occured. |
| options.duration    | number                 | Defines the lifetime in miliseconds of the spawned Watcher instances.                   |
