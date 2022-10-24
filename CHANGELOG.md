## 0.216.0 (24 Oct, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.215.0 (17 Oct, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.214.0 (13 Oct, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.213.0 (23 Sep, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.212.0 (6 Sep, 2022)

### Maintenance

- Ensures preview.js is resolved within ESM environments (package.json type="module").
- Implements NPM package maintenance

## 0.211.0 (6 Sep, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.210.0 (2 Sep, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.209.0 (31 Aug, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.208.0 (22 Aug, 2022)

### Maintenance

- Implements NPM package maintenance

## 0.207.0 (17 Aug, 2022)

### Maintenance

- Implements NPM package maintenance (for Node 16+).

## 0.206.0 (8 Aug, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.205.0 (2 Aug, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.204.0 (1 Aug, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.203.0 (Jul 26, 2022)

### Features

- Minimizes Console message amount for non verbose instances.
- Auto close the Watcher instance if the StyleguideCompiler is not running.

## 0.202.0 (Jul 26, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.201.0 (Jul 25, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.200.2 (Jul 19, 2022)

### Maintenance

- SassCompiler: Adjusts empty entry stylesheets for each defined entry working
  directory.

## 0.200.1 (Jul 19, 2022)

### Maintenance

- StyleguideCompiler: Move Webpack 5 devdependencies as dependencies.

## 0.200.0 (Jul 19, 2022)

### Features

- StyleguideCompiler: Enabled Webpack 5 builder.

### Maintenance

- Implement NPM package maintenance.

## 0.126.0 (Jun 28, 2022)

### Features

- StyleguideHelper: Implements `filterKeywords` option to simplify Module exports.

## 0.125.3 (Jun 28, 2022)

### Maintenance

- Remove console.log

## 0.125.2 (Jun 28, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.125.1 (Jun 28, 2022)

### Maintenance

- Remove run command from AssetExporter.

## 0.125.0 (Jun 27, 2022)

### Maintenance

- Ensures the Watcher is correctly closed to prevent duplicate process exception.
- Use named exports instead of default exports for Harbor Core Classes.
- Implements NPM package maintenance.

## 0.124.2 (Jun 22, 2022)

### Maintenance

- Include Resolver within the run series

## 0.124.1 (Jun 22, 2022)

### Maintenance

- Ensure the order is correct for synchronous Worker hooks like run::X

## 0.124.0 (Jun 21, 2022)

### Features

- Includes implementation information within TIPS.md

### Maintenance

- Ensure the static styleguide is removed after a test has been processed.

## 0.123.0 (Jun 20, 2022)

### Features

- Enable File Watcher after WSS connection instead of stopping the process.

### Maintenance

- Implements NPM package maintenance.

## 0.122.0 (Jun 14, 2022)

### Maintenance

- Use correct base directory during JS bundling.

## 0.121.0 (Jun 13, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.120.7 (Jun 1, 2022)

### Maintenance

- Implements NPM package maintenance.
- Fixes JSOptimizer minify issue for `development` environments.

## 0.120.6 (May 23, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.120.5 (May 12, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.120.4 (May 3, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.120.3 (April 12, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.120.2 (April 11, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.120.1 (April 1, 2022)

### Maintenance

- Fixes async issue within Watcher instances.

## 0.120.0 (April 1, 2022)

### Maintenance

- Includes support for multiple worker tasks within a Watcher instance.

## 0.119.0 (April 1, 2022)

### Maintenance

- Move AssetExporter as Worker instead of Plugin.
- Implements NPM package maintenance.

## 0.118.5 (March 31, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.118.4 (March 29, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.118.3 (March 25, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.118.2 (March 24, 2022)

### Maintenance

- AssetExporter - Don't wrap anonymous function around asset export.

## 0.118.1 (March 24, 2022)

### Maintenance

- AssetExporter - Use Theme Destination while resolving entries.

## 0.118.0 (March 24, 2022)

### Features

- AssetExporter - Exports generated assets into a JS module literal.

## 0.117.4 (March 23, 2022)

### Maintenance

- Don't suffix package.json while Resolving direct paths from dependencies.

## 0.117.2 (March 23, 2022)

### Maintenance

- Implements NPM package maintenance.

## 0.117.1 (March 16, 2022)

### Features

- StyleguideHelper - Optimizes generated module names.

## 0.117.0 (March 16, 2022)

### Features

- StyleguideHelper - Override the external configuration with optional source file defined from `includeDirectories`.

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
