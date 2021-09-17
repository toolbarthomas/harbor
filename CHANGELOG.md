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
