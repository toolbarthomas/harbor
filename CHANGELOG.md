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
