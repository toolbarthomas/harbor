## 0.901.0 (12 Aug, 2024)

### Maintenance

- Node: Minor package dependency upgrades

## 0.900.0 (9 Aug, 2024)

### Maintenance

- Node: Minor package dependency upgrades
- Eslint: Upgrade to version 9.8 and exclude configuration presets.

## 0.816.0 (6 Aug, 2024)

### Maintenance

- Node: Minor package dependency upgrades

## 0.815.0 (5 Aug, 2024)

### Maintenance

- Node: Minor package dependency upgrades

## 0.814.0 (9 Jul, 2024)

### Maintenance

- Node: Minor package dependency upgrades

## 0.813.3 (2 Jul, 2024)

### Maintenance

- Node: Minor package dependency upgrades


## 0.813.2 (24 Jun, 2024)

### Maintenance

- Node: Minor package dependency upgrades

## 0.813.1 (19 Jun, 2024)

### Maintenance

- Node: Updates to Storybook Preview Api 8.1.10

## 0.813.0 (18 Jun, 2024)

### Maintenance

- Node: Updates to Storybook 8.1.10

## 0.812.0 (11 Jun, 2024)

### Maintenance

- Node: Updates to Storybook 8.1.6
- Node: Minor package dependency upgrades

## 0.811.0 (3 Jun, 2024)

### Maintenance

- Node: Updates to Storybook 8.1.5
- Node: Minor package dependency upgrades

## 0.810.0 (27 May, 2024)

### Maintenance

- Node: Updates to Storybook 8.1.3
- Node: Minor dependency upgrades

## 0.809.1 (13 May, 2024)

### Maintenance

- Node: Updates to Storybook 8.0.10
- General: Use patch version for future Storybook patch updates.

## 0.809.0 (23 April, 2024)

### Maintenance

- Node: Updates to Storybook 8.0.9

## 0.808.0 (12 April, 2024)

### Maintenance

- Node: Updates to Storybook 8.0.8

## 0.806.1 (8 April, 2024)

### Maintenance

- Eslint: Temporary Eslint downgrade from `9.0.0` to `8.57.0` to minimize PeerDependency issues. The Node version requirement has not been removed to ensure the usage of version 9.x within the future.

## 0.806.0 (8 April, 2024)

### Maintenance

- Node: Updates to Storybook 8.0.6
- Eslint: Drop Support for Node.js < 18.18.x.

Note: Fixed versions for twing@5.2.2 and twing-loader@4.0.1 are used to ensure
the initial behaviour of Twig 2.x syntax. Harbor should work within any Twig 3.0
environment (e.g. Drupal 10+).

[API](https://twing.nightlycommit.com/)
[Core](https://gitlab.com/nightlycommit/twing)
[Loader](https://gitlab.com/nightlycommit/twing-loader)

## 0.805.0 (5 April, 2024)

### Maintenance

- Node: Updates to Storybook 8.0.5

## 0.800.0 (27 March, 2024)

### Maintenance

- Node: Updates to Storybook 8.0.4

## 0.724.0 (26 March, 2024)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.723.0 (6 March, 2024)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.722.0 (4 March, 2024)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.721.0 (1 March, 2024)

### Maintenance

- Node: Updates to Storybook 7.6.17


## 0.720.0 (1 Janurary, 2024)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.712.0 (02 November, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.711.0 (26 October, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.710.0 (19 October, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.709.0 (17 October, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.708.0 (12 October, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance.

## 0.707.1 (10 October, 2023)

### Maintenance

- Storybook: Optimize Asset loading interval.

## 0.707.0 (10 October, 2023)

### Maintenance

- Storybook: Await JS dependencies to ensure the attach method is called for all `Drupal.behaviors` entries. This should resolve the issue where the `DOMContentLoaded` event was not completed during the initial runOnPageChange Storybook template callback.

## 0.706.0 (10 October, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance

## 0.705.0 (3 October, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance

## 0.704.0 (25 September, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance

## 0.703.0 (11 September, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance

## 0.702.0 (6 September, 2023)

### Maintenance

- Node: Updates Babel packages to 7.22.15

## 0.701.0 (4 September, 2023)

### Maintenance

- Node: Implements minor NPM package maintenance
- Storybook: Upgrade utilities to 7.5

## 0.700.0 (9 Aug, 2023)
This release includes the newly released Storybook version 7. Some modifications within your stories definities are required in order to correctly the Twig templates within the Storybook environment. You can follow the example for the default [Storybook HTML environment](https://storybook.js.org/docs/html/writing-stories/introduction). (The README.md has also been updated regarding this breaking change.)

### Features

- Storybook V7: See the release notes [@storybook](https://storybook.js.org/releases/7.0).


## 0.300.0 (9 Aug, 2023)
This maintenance release updates to the current Node packages that are used within the build process.
This is a in between maintenance release for Harbor Storybook 6.5. The migration for Storybook V7 is currently under development.
Future release will be based from 0.700.0 version scheme that includes the update to Storybook V7

### Maintenance

- Node: Implements NPM package maintenance, does not update Storybook to V7.

## 0.226.1 (2 Jan, 2023)

### Features

- Core: Include `ignore` option to exclude the defined paths for the given Worker & Plugin.

### Maintenance

- Node: Implements NPM package maintenance

## 0.225.0 (22 Dec, 2022)

### Maintenance

- Node: Implements NPM package maintenance

## 0.224.0 (19 Dec, 2022)

### Maintenance

- Node: Implements NPM package maintenance

## 0.223.1 (12 Dec, 2022)

### Maintenance

- Node: Implements NPM package maintenance

## 0.223.0 (9 Dec, 2022)

### Maintenance

- Node: Implements NPM package maintenance

## 0.222.1 (29 Nov, 2022)

### Maintenance

- SVGSpriteCompiler: Use inline style SVGO plugin to catch CSS styled SVG images.

## 0.222.0 (28 Nov, 2022)

### Maintenance

- Node: Implements NPM package maintenance.
- Harbor: Updates CHANGELOG prefix labels.

## 0.221.0 (22 Nov, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.220.2 (8 Nov, 2022)

### Maintenance

- Node: Reverts npm audit fix

## 0.220.0 (8 Nov, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.219.0 (3 Nov, 2022)

### Maintenance

- StyleguideTester: Install backstopjs within worker to improve initial NPM install.

## 0.218.0 (3 Nov, 2022)

### Features

- SVGSpriteCompiler: Cleanup xlink:href attributes from the SVG sprite.

## 0.217.4 (2 Nov, 2022)

### Maintenance

- StyleguideTester: Resolve THEME_PORT environment issue for StyleguideTester

## 0.217.3 (2 Nov, 2022)

### Maintenance

- Storybook: Resolves React 18 peer dependency (move as dependcy instead of devdependency)

## 0.217.2 (2 Nov, 2022)

### Maintenance

- Storybook: Resolves React 18 peer dependency

## 0.217.1 (2 Nov, 2022)

### Maintenance

- Node: Implements NPM package maintenance.
- Resolve SVGO removeAttr default option order issue.

## 0.217.0 (28 Oct, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.216.0 (24 Oct, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.215.0 (17 Oct, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.214.0 (13 Oct, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.213.0 (23 Sep, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.212.0 (6 Sep, 2022)

### Maintenance

- Ensures preview.js is resolved within ESM environments (package.json type="module").
- Node: Implements NPM package maintenance.

## 0.211.0 (6 Sep, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.210.0 (2 Sep, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.209.0 (31 Aug, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.208.0 (22 Aug, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.207.0 (17 Aug, 2022)

### Maintenance

- Node: Implements NPM package maintenance (for Node 16+).

## 0.206.0 (8 Aug, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.205.0 (2 Aug, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.204.0 (1 Aug, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.203.0 (Jul 26, 2022)

### Features

- Console: Minimizes Console message amount for non verbose instances.
- Watcher: Auto close the Watcher instance if the StyleguideCompiler is not running.

## 0.202.0 (Jul 26, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.201.0 (Jul 25, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

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

- Node: Implements NPM package maintenance.

## 0.126.0 (Jun 28, 2022)

### Features

- StyleguideHelper: Implements `filterKeywords` option to simplify Module exports.

## 0.125.3 (Jun 28, 2022)

### Maintenance

- Harbor: Remove console.log

## 0.125.2 (Jun 28, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.125.1 (Jun 28, 2022)

### Maintenance

- Remove run command from AssetExporter.

## 0.125.0 (Jun 27, 2022)

### Maintenance

- Watcher: Ensures the Watcher is correctly closed to prevent duplicate process exception.
- Harbor: Use named exports instead of default exports for Harbor Core Classes.
- Node: Implements NPM package maintenance.

## 0.124.2 (Jun 22, 2022)

### Maintenance

- Resolver: Include Resolver within the run series

## 0.124.1 (Jun 22, 2022)

### Maintenance

- Harbor: Ensure the order is correct for synchronous Worker hooks like run::X

## 0.124.0 (Jun 21, 2022)

### Features

- Harbor: Includes implementation information within TIPS.md

### Maintenance

- StyleguideTester: Ensure the static styleguide is removed after a test has been processed.

## 0.123.0 (Jun 20, 2022)

### Features

- Watcher: Enable File Watcher after WSS connection instead of stopping the process.

### Maintenance

- Node: Implements NPM package maintenance.

## 0.122.0 (Jun 14, 2022)

### Maintenance

- JSCompiler: Use correct base directory during JS bundling.

## 0.121.0 (Jun 13, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.120.7 (Jun 1, 2022)

### Maintenance

- Node: Implements NPM package maintenance.
- JSOptimizer: Fixes JSOptimizer minify issue for `development` environments.

## 0.120.6 (May 23, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.120.5 (May 12, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.120.4 (May 3, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.120.3 (April 12, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.120.2 (April 11, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.120.1 (April 1, 2022)

### Maintenance

- Watcher: Fixes async issue within Watcher instances.

## 0.120.0 (April 1, 2022)

### Maintenance

- Watcher: Includes support for multiple worker tasks within a Watcher instance.

## 0.119.0 (April 1, 2022)

### Maintenance

- Move AssetExporter as Worker instead of Plugin.
- Node: Implements NPM package maintenance.

## 0.118.5 (March 31, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.118.4 (March 29, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.118.3 (March 25, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.118.2 (March 24, 2022)

### Maintenance

- AssetExporter: Don't wrap anonymous function around asset export.

## 0.118.1 (March 24, 2022)

### Maintenance

- AssetExporter: Use Theme Destination while resolving entries.

## 0.118.0 (March 24, 2022)

### Features

- AssetExporter: Exports generated assets into a JS module literal.

## 0.117.4 (March 23, 2022)

### Maintenance

- General: Don't suffix package.json while Resolving direct paths from dependencies.

## 0.117.2 (March 23, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.117.1 (March 16, 2022)

### Features

- StyleguideHelper: Optimizes generated module names.

## 0.117.0 (March 16, 2022)

### Features

- StyleguideHelper: Override the external configuration with optional source file defined from `includeDirectories`.

## 0.116.0 (March 15, 2022)

### Features

- StyleguideHelper: Implements StyleguideHelper variants option to define initial Module variants.

### Maintenance

- Node: Implements NPM package maintenance.

## 0.115.0 (March 14, 2022)

### Features

- StyleguideHelper: Implements StyleguideHelper worker that enables initial styleguide entry configuration.

### Maintenance

- SVGSpriteCompiler: Writes the compiled SVG sprites to the correct destination directory that is relative to the SVG entry sources. This resolves the issue where the SVG sprite was written one level higher of the original directory. You should update your icon paths for the sprite images as of this version.

## 0.114.1 (March 14, 2022)

### Maintenance

- Harbor: Cleanup unused scripts.
- Node: Implements NPM package maintenance.

## 0.114.0 (March 8, 2022)

### Maintenance

- Harbor: Cleanup some logic.
- Twing: Mark Twing Builder legacy option as WIP.
- Node: Implements NPM package maintenance.

## 0.112.2 (March 8, 2022)

### Maintenance

- Twing: Remove renderContext fallback.

## 0.112.1 (March 8, 2022)

### Maintenance

- StyleguideCompiler: Ensure Twing libraries are correctly installed when using useLegacyCompiler.

## 0.112.0 (March 8, 2022)

### Features

- StyleguideCompiler: Implements `useLegacyCompiler` option that enables the usage of older Twing libraries within the styleguide to disable the requirement of async stories.

## 0.111.0 (March 4, 2022)

### Features

- StyleguideTester: Implements optional scenarios for backstopJS.

## 0.110.2 (March 3, 2022)

### Features

- StyleguideTester: Inherit stdio setting for `StyleguideTester`.

## 0.110.1 (March 3, 2022)

### Maintenance

- StyleguideTester: Cleanup `StyleguideTester` worker configuration.

## 0.110.0 (March 3, 2022)

### Features

- StyleguideTester: Implements `StyleguideTester` worker to enable Styleguide Snapshot testing.

## 0.105.2 (February 21, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.105.1 (February 16, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.105.0 (February 14, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.104.0 (January 28, 2022)

### Features

- StyleguideCompiler: Implements `librariesOverrides` option for `StyleguideCompiler` plugin to resolve library sources to another file.

### Maintenance

- Node: Implements NPM package maintenance.

## 0.103.7 (January 28, 2022)

### Maintenance

- Storybook: Load library scripts in synchronous order to ensure correct dependency behaviors.

## 0.103.6 (January 26, 2022)

### Maintenance

- Watcher: Fixes issue for created Websocket id, ensure invalid characters are filtered.

## 0.103.5 (January 25, 2022)

### Maintenance

- Storybook: Disable Babel module transpiler.

## 0.103.4 (January 25, 2022)

### Maintenance

- Storybook: Fix attributes usage for script libraries.

## 0.103.3 (January 25, 2022)

### Maintenance

- Storybook: Include attribute support for theme libraries within the styleguide.

## 0.103.2 (January 24, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.103.1 (January 20, 2022)

### Maintenance

- SassCompiler: Fixes configuration exception for Stylelint.

## 0.103.0 (January 20, 2022)

### Maintenance

- Node: Implements NPM package maintenance.
- Storybook: Exclude addons from current @storybook/addon-essentials.
- Storybook: Fixes staticDirectory error during the Storybook static build.
- Storybook: Removed duplicate Storybook addon packages, you should install them within your project and define it within the `harbor.config.js`.
- Watcher: Fixed Stylesheet Watcher within the Storybook development environment.

## 0.102.0 (January 18, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.101.0 (January 10, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.100.0 (January 7, 2022)

### Features

- Twing: Implements async Storybook loaders to compile with the async Twing Loader.
- Twing: Updates to latest Twing Compiler & Twing Loader.

### Maintenance

- Node: Implements NPM package maintenance.
- Storybook: Fixes staticDir Storybook CLI deprecation warning.

## 0.94.1 (January 3, 2022)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.94.0 (December 23, 2021)

### Features

- Harbor: Use child_process within concurrent tasks.
- SassCompiler: Dont' save the Node Sass compiler to the package.json since it will be installed on the fly.

## 0.93.3 (December 23, 2021)

### Maintenance

- SassCompiler: Adjust Sass Compiler logging.

## 0.93.2 (December 23, 2021)

### Maintenance

- SassCompiler: Fixes an issue where Node Sass was missing during the initial setup.

## 0.93.1 (December 23, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

### Features

- SassCompiler: Use the Dart Sass compiler by default, Node Sass can be installed during the initial setup.
- SassCompiler: Include option to use the legacy Node Sass Compiler within the configuration: `useLegacyCompiler`

## 0.92.0 (December 14, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.91.0 (December 2, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.90.1 (November 25, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.90.0 (October 25, 2021)

### Features

- Include support for multiple entry sources.

## 0.89.6 (November 23, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.89.5 (November 12, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.89.4 (November 4, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.89.3 (October 19, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

## 0.89.2 (October 6, 2021)

### Maintenance

- Simplify Drupal behaviors.
- Node: Implements NPM package maintenance.

## 0.89.0 (October 6, 2021)

### Features

- Append attached libraries to the head instead.

## 0.88.5 (October 5, 2021)

### Maintenance

- Fixes DomContentLoaded Stacking issue.

## 0.88.4 (October 4, 2021)

### Maintenance

- Fixes DomContentLoaded Stacking issue.
- Node: Implements NPM package maintenance.

## 0.88.1 (October 1, 2021)

### Maintenance

- Improves command line interface behaviour.

## 0.88.0 (October 1, 2021)

### Features

- General: Implements command line interface via `$ harbor`

## 0.87.1 (September 27, 2021)

### Maintenance

- Node: Implements NPM package maintenance.

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

- Node: Implements NPM package maintenance.

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
