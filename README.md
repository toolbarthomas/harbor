# Harbor

Build Drupal compatible Twig styleguides, components and templates within Storybook.

Forget about maintaining multiple environements for your Drupal project:
Define, develop and test any Twig pattern within Storybook; implements these patterns within Drupal and apply optional [data transformation](./markdown/STRUCTURE.md) in seperate Drupal specific templates.

## 💎 Features:

- Native support for [Storybook](https://storybook.js.org/)
- Complete Twig compatibility within your [Storybook](https://storybook.js.org/) & [Drupal](https://www.drupal.org/docs/upgrading-drupal/prepare-major-upgrade/preparing-for-use-of-twig-2-in-drupal-9) environments.
- Includes optional asset [compilers](./markdown/VENDORS.md) or use any preferred tooling instead.
- Support for Drupal [libraries](https://www.drupal.org/docs/develop/theming-drupal/adding-assets-css-js-to-a-drupal-theme-via-librariesyml) within any template via `attach_library` feature.
- Includes: [Twig namespaces & variables](), [Generated Storybook definitions](), [Twig functions/filters]() and many more!
- Modular functionality with no dependency fragmentation.
- Use the classic Drupal front-end or include popular framework tooling like [Lit Element](https://lit.dev/), [React](https://react.dev/), [Vue](https://vuejs.org/) or any other custom framework.

## 🥚 The Concept:

1. A composed Twig template that can directly be included within Drupal & Storybook
2. Modular asset management by using the included `attach_library` template function.
3.

@WIP

## 🚀 Let's begin:

Harbor is specifically used during the development of your Twig components for a custom Drupal theme or module.
You should install Harbor directly within the root of this module/theme context via [Node.js](https://nodejs.org):

```sh
$ npm install @toolbarthomas/harbor
```

Harbor will run the [default Workers](./markdown/WORKERS.md) while running the Node command without any arguments.
The Workers will process any existing asset within the [default configuration](./markdown/CONFIGURATION.md).

## 🎨 Stylguide ABC

The default Harbor command will only generate the assets that could be used within the Twig templates.
You can generate and view any existing Twig templates within one single command while following the [configured structure](./markdown/STRUCTURE.md):

```sh
$ node ./node_modules/@toolbarthomas/harbor/index.js --task=setup
```

Harbor will scan your working directory for any existing Twig component and generates the minimal Storybook stories with optional mocking data.
With any Storybook stories template you can view your styleguide via:

```sh
$ node ./node_modules/@toolbarthomas/harbor/index.js --styleguide
```

That's it, a styleguide will be generated or launched according to your environment mode.
More information regarding the workflow, API & implementations can be found here:

1. [Workers](./markdown/WORKERS.md)
2. [Plugins](./markdown/PLUGINS.md)
3. [Implementations](./markdown/STRUCTURE.md) and [Tips/tricks](./markdown/TIPS.md)
4. [Changelog](./CHANGELOG.md) or [Deprecations](./markdown/UPGRADE.md)

## ⚙️ Modular Tooling

Harbor comes with optional Worker utilities that can generate the actual assets for the theme.
These compilers are completely optional and can always be enabled/disabled according to your configuration:

- Minimal [Storybook](https://storybook.js.org/docs/get-started) setup that can be extended by your needs.
- Sass (from [Dart Sass](https://github.com/sass/dart-sass) or [Legacy Lib Sass](https://github.com/sass/node-sass))
- ES5+ Support via [BabelJS](https://babeljs.io/)
- Inline SVG Sprites generation with [SVGO]() & [SVGStore]()
- Capture & compare components screenshot testing with the included [BackstopJS](https://github.com/garris/BackstopJS) testing suite.
- Optional Linting utils: [Eslint](https://eslint.org/) and [Stylelint](https://stylelint.io/)

The actual [Workers](./markdown/WORKERS.md) are triggered from the configured NPM commands,you can customize this configuration and many more via an optional Harbor configration.

See the [Front-End Guidelines](./markdown/API.md) for more details regarding the usage and documentation.
