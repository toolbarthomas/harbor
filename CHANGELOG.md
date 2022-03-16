## 0.117.0 (March 16, 2022)

### Features

- Override the external configuration if the current variant has any directories defined.

## 0.116.0 (March 15, 2022)

### Features

- Implements StyleguideHelper variants option to define initial Module variants.

### Maintenance

- Implements NPM package maintenance.

## 0.115.0 (March 14, 2022)

### Features

- Implements StyleguideHelper worker that enables initial styleguide entry configuration.

### Maintenance

- Writes the compiled SVG sprites to the correct destination directory that is relative to the SVG entry sources. This resolves the issue where the SVG sprite was written one level higher of the original directory. You should update your icon paths for the sprite images as of this version.

## 0.114.1 (March 14, 2022)

### Maintenance

- Cleanup unused scripts.
- Implements NPM package maintenance.

## 0.114.0 (March 8, 2022)

### Maintenance

- Cleanup some logic.
- Mark Twing Builder legacy option as WIP.
- Implements NPM package maintenance.

## 0.112.2 (March 8, 2022)

### Maintenance

- Remove renderContext fallback.

## 0.112.1 (March 8, 2022)

### Maintenance

- Ensure Twing libraries are correctly installed when using useLegacyCompiler.

## 0.112.0 (March 8, 2022)

### Features

- Implements `useLegacyCompiler` option that enables the usage of older Twing libraries within the styleguide to disable the requirement of async stories.

## 0.111.0 (March 4, 2022)

### Features

- Implements optional scenarios for backstopJS.

## 0.110.2 (March 3, 2022)

### Features

- Inherit stdio setting for `StyleguideTester`.

## 0.110.1 (March 3, 2022)

### Maintenance

- Cleanup `StyleguideTester` worker configuration.

## 0.110.0 (March 3, 2022)

### Features

- Implements `StyleguideTester` worker to enable Styleguide Snapshot testing.

## 0.105.2 (February 21, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.105.1 (February 16, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.105.0 (February 14, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.104.0 (January 28, 2022)

### Features

- Implements `librariesOverrides` option for `StyleguideCompiler` plugin to resolve library sources to another file.

### Maintenance

- Implements NPM package maintenance.

## 0.103.7 (January 28, 2022)

### Maintenance

- Load library scripts in synchronous order to ensure correct dependency behaviors.

## 0.103.6 (January 26, 2022)

### Maintenance

- Fixes issue for created Websocket id, ensure invalid characters are filtered.

## 0.103.5 (January 25, 2022)

### Maintenance

- Disable Babel module transpiler.

## 0.103.4 (January 25, 2022)

### Maintenance

- Fix attributes usage for script libraries.

## 0.103.3 (January 25, 2022)

### Maintenance

- Include attribute support for theme libraries within the styleguide.

## 0.103.2 (January 24, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.103.1 (January 20, 2022)

### Maintenance

- Fixes configuration exception for Stylelint.

## 0.103.0 (January 20, 2022)

### Maintenance

- Implements NPM package maintenance.
- Exclude addons from current @storybook/addon-essentials.
- Fixes staticDirectory error during the Storybook static build.
- Removed duplicate Storybook addon packages, you should install them within your project and define it within the `harbor.config.js`.
- Fixed Stylesheet Watcher within the Storybook development environment.

## 0.102.0 (January 18, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.101.0 (January 10, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.100.0 (January 7, 2022)

### Features

- Implements async Storybook loaders to compile with the async Twing Loader.
- Updates to latest Twing Compiler & Twing Loader.

### Maintenance

- Implements NPM package maintenance.
- Fixes staticDir Storybook CLI deprecation warning.

## 0.94.1 (January 3, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.94.0 (December 23, 2021)

### Features

- Use child_process within concurrent tasks.
- Dont' save the Node Sass compiler to the package.json since it will be installed on the fly.

## 0.93.3 (December 23, 2021)

### Maintenance

- Adjust Sass Compiler logging.

## 0.93.2 (December 23, 2021)

### Maintenance

- Fixes an issue where Node Sass was missing during the initial setup.

## 0.93.1 (December 23, 2021)

### Maintenance

- Implements NPM package maintenance.

### Features

- Use the Dart Sass compiler by default, Node Sass can be installed during the initial setup.
- Include option to use the legacy Node Sass Compiler within the configuration: `useLegacyCompiler`

## 0.92.0 (December 14, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.91.0 (December 2, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.90.1 (November 25, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.90.0 (October 25, 2021)

### Features

- Include support for multiple entry sources.

## 0.89.6 (November 23, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.89.5 (November 12, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.89.4 (November 4, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.89.3 (October 19, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.89.2 (October 6, 2021)

### Maintenance

- Simplify Drupal behaviors.
- Implements NPM package maintenance.

## 0.89.0 (October 6, 2021)

### Features

- Append attached libraries to the head instead.

## 0.88.5 (October 5, 2021)

### Maintenance

- Fixes DomContentLoaded Stacking issue.

## 0.88.4 (October 4, 2021)

### Maintenance

- Fixes DomContentLoaded Stacking issue.
- Implements NPM package maintenance.

## 0.88.1 (October 1, 2021)

### Maintenance

- Improves command line interface behaviour.

## 0.88.0 (October 1, 2021)

### Features

- General: Implements command line interface via `$ harbor`

## 0.87.1 (September 27, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.87.0 (September 23, 2021)

### Features

- Storybook: Implements Drupal.displace javascript polyfill.

## 0.86.3 (September 17, 2021)

### Features

- Storybook: Include and enable minify options for static styleguide.

### Maintenance

- Storybook: Minor glob fixes.

## 0.86.2 (September 16, 2021)

### Maintenance

- Storybook: Ensure LiveReload functionality is disabled for static styleguide.
- Storybook: Fixes DefinePlugin parsing error.

## 0.86.0 (September 16, 2021)

### Features

- Storybook: Ensure processed assets are included within the static styleguide.
- JSOptimizer: Minify bundle for production.

## 0.85.4 (August 24, 2021)

### Maintenance

- Implements NPM package maintenance.

## 0.85.3 (August 13, 2021)

### Features

- Storybook: Include `staticDirectory` option in order to define a custom destination for the static styleguide build.

### Maintenance

- Harbor: Removed `::` pattern for Plugin hooks since they should be Async only.
- Harbor: Remove option to use multiple hooks for a single Plugin.
- Harbor: Notify the user about unused command line arguments.
- Websocket: Updates to 8.1.0
- StyleguideCompiler: Resolve and Reject the static styleguide builds.

## 0.85.2 (August 12, 2021)

### Maintenance

- ConfigManager: Resolves Babel Eslint syntax issues.
- EsLint: Fixes the Eslint configuration for Harbor internals.

## 0.85.1 (August 11, 2021)

### Features

- Initial setup for a basic development changelog, added changes from 0.85.0+

## 0.85.0 (August 11, 2021)

### Maintenance

- Node: Implements NPM package maintenance.
- Storybook: Use restricted addons to prevent duplicate addon configuration definitions.
- Storybook: Updates Storybook dependencies prior to 6.3.7
