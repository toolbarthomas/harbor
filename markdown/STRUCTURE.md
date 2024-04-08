# Harbor Structure

## ⛺️ Default Configuration

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

## ⚙️ Common Configuration

The following configuration options are available for the default [Workers](./WORKERS.md) & [Plugins](./PLUGINS.md).
Most options are used before the defined Worker/Plugin is actually running; like resolving the actual entry files or ignoring some source paths for the Worker/Plugin entry:

| Option  | type            | Description                                                                                                                                            |
| ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| entry   | String/String[] | The actual sources that will be processed for the defined Worker or Plugin.                                                                            |
| hook    | String          | Defines the commands that should start the given Worker or Plugin                                                                                      |
| ignore  | String/String[] | Excludes the defined path(s) from the entry sources for the defined Worker or Plugin.                                                                  |
| options | Object          | Defines the optional configuration for the defined Worker/Plugin, the actual options are not common since they are defined for the used NPM libraries. |


## 🪵 Environment

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

## 📦 Basic NPM usage

The following commands can be included within the NPM package.json file in order to run Harbor properly:
You can use these command entries while using the default hook configuration:

```js
  {
    "production": "node node_modules/@toolbarthomas/harbor/index.js --task=prepare,compile --minify",
    "predevelopment": "npm run production",
    "development": "node node_modules/@toolbarthomas/harbor/index.js --watch --styleguide",
    "images": "node node_modules/@toolbarthomas/harbor/index.js --task=images",
    "javascripts": "node node_modules/@toolbarthomas/harbor/index.js --task=javascripts",
    "resolve": "node node_modules/@toolbarthomas/harbor/index.js --task=resolve",
    "styleguide": "node node_modules/@toolbarthomas/harbor/index.js --styleguide",
    "stylesheets": "node node_modules/@toolbarthomas/harbor/index.js --task=stylesheets",
    "test": "node node_modules/@toolbarthomas/harbor/index.js --task=test",
  }
```

## 💧 Drupal & Storybook Implementations

Harbor can be directly integrated within your custom Drupal theme/module context.
The custom Twing integration for Storybook enables the usage of any Drupal related Twig features like functions and filters.

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
