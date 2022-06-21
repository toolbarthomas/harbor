# Creating Drupal 8+ compatible environments within Harbor

This document contains some basic information on how you can setup a styleguide environment that is compatible with the Twig template that will be used within your Drupal environment.

1. [Creating custom Twig Templates](#1)
2. [About the Drupal variable usage](#2)
3. [Generating Storybook stories from existing Twig templates](#3)
4. [Including assets via attach_library Twig function](#4)
5. [Exporting assets as JS module to Web Components](#5)
6. [Implementing Lit element within the Harbor structure](#6)
7. [Using BackstopJS testing suite](#7)

<br />
<br />

# 1. Creating custom Twig Templates <a id="1"></a>

A Harbor environment expects that the general Twig templates are splitted from the Drupal templates. Instead of directly inserting any markup within the Drupal template we define standalone Twig templates. These standalone templates should be included within the required Drupal templates and should use semantic variables instead of the Drupal reserved variables like render arrays.

```twig
{# src/components/standalone-component.twig #}

<div class="standalone-component">
  {% if title is not empty %}
    <h2 class="standalone-component__title">{{ title }}</h2>
  {% endif %}

  {% if description is not empty %}
    <p class="standalone-component__description">{{ description }}</p>
  {% endif %}

  {% if image is not empty %}
    {% block image %}
      {{ image }}
    {% endblock %}
  {% endif %}
</div>
```

The actual CMS values should be used during the include of the Drupal template:

```twig
{# node.html.twig #}

{% include "@theme/src/components/standalone-component.twig" with {
  title: label,
  description: content.field_description.0,
  image: content.field_image,
} %}
```

<br />
<br />

# 2. About the Drupal variable usage <a id="2"></a>

Drupal makes heavy use of the their Render arrays and sometimes it can be difficult to include these variables within your custom templates.

Using complex renders like images or responsive images can be a little bit tricky since the actual source is defined within the Drupal related template.
Using the variable directly in your custom component will generate a content ID instead of the actual image. We can resolve this by using Twig blocks within the template as optional render or define the correct source path within the parent Drupal template.

```twig
{#
  standalone-component.twig

  We can use Twig blocks to ensure the image is also rendered correcly within the Drupal environment.
  Storybook will use the variables that are defined within each block.
#}

<div class="standalone-component">
  {% if title is not empty %}
    <h2 class="standalone-component__title">{{ title }}</h2>
  {% endif %}

  {% if description is not empty %}
    <p class="standalone-component__description">{{ description }}</p>
  {% endif %}

  {% if image is not empty %}
    {% block image %}
      <img src="image.src" alt="image.alt" />
    {% endblock %}
  {% endif %}
</div>
```

```twig
  {#
    node.html.twig

    A Twig block has been defined for the image so we can directly use the render Array.
    We need to use embed instead of include when using blocks:
  #}

  {% embed "@theme/src/components/standalone-component.twig" with {
    title: content.field_title.0,
    description: content.field_summary.0
  } %}
    {% block image %}
      {{ content.field_image }}
    {% endblock %}
  {% endembed %}
```

Using `include` is also possible, but keep in mind that need to directly output the variable in order to match the behavior of the Drupal render array.

```twig
  {#
    node.html.twig

    We use include in this example so we should use {{ image }} instead of defining the image source and alt attributes separately within the template:
  #}

  {% include "@theme/src/components/standalone-component.twig" with {
    title: content.field_title.0,
    description: content.field_summary.0,
    image: content.field_image
  } %}

  {# Process the rest of the Drupal render array to ensure the Cache tags are set correctly. #}
  {{ content|without('field_image', 'field_summary', 'field_title') }}
```

Using `.0` within the simple variables ensures the RAW value is generated from Drupal but keep in mind that it can give issues regarding the cache, you should render the rest of the content like above.

<br />
<br />

####

# 3. Generating Storybook stories from the existing templates <a id="3"></a>

It is possible to generate the Storybook components with optional data by creating a configuration file relative to your Twig template. A Storybook story can be automatically generated with dynamic data by using `$ harbor --setup` or `node node_modules/@toolbarthomas/harbor/index.js --setup`. You should define your configuration as: `JSON`, `YAML` or `JS modules [MJS/JS]`.

The following Harbor commmand will create Storybook stories for the existing Twig templates that uses one of the mock files:

```php
# standalone-component.stories.js will be generated within the defined StyleguideHelper destinationDirectory (./src/styleguide) configuration entry.

./src
  |- standalone-component.twig
  |- standalone-component.json
```

```bash
$ node node_modules/@toolbarthomas/harbor/index.js --setup
```

Will generate standalone-component.stories.js that is based from the existing Twig template:

```js
import StandAloneComponent from '@theme/src/components/responsive-menu/responsive-menu.twig';

import StandAloneComponentConfiguration from '@theme/src/components/responsive-menu/responsive-menu.js';

export default {
  title: 'Components / StandAloneComponent',
  loaders: [
    async ({ args }) => ({
      StandAloneComponent: await StandAloneComponent(args),
    }),
  ],
};

export const Default = (args, { loaded }) => loaded.ResponsiveMenu;
Default.args = ResponsiveMenuConfiguration;
```

<br />
<br />

# 4. Including assets via attach_library Twig function <a id="4"></a>

You can use the `attach_library` Drupal function within [Storybook](https://storybook.js.org/docs/html/get-started/introduction) in order to include the required CSS & JS assets within your custom templates, to ensure you don't need to add them specificly within Storybook.
The library files are compatible with your Drupal theme, more information regarding [Asset Management](https://www.drupal.org/docs/creating-custom-modules/adding-assets-css-js-to-a-drupal-module-via-librariesyml) can be found at Drupal.org.

It is recommended to split the assets for each component instead of bundling everything into 1 single file:

```yml
# my_theme.libraries.yml

base:
  css:
    base:
      dist/base/index.css: {}

standalone-component:
  css:
    component: dist/components/standalone-component/index.css: {}
  dependencies:
    - my_theme/base
```

With the above example you can assign the required assets within your custom component:

```twig
{{ attach_library('my_theme/standalone-component') }}

<div class="standalone-component">...</div>
```

Adding Javascript files is also possible, but keep in mind that you wan't to define the script within the [Drupal](https://drupaljs.net/Drupal.html) Javascript global.

```js
(function standaloneComponent(Drupal) {
  Drupal.behaviors.standaloneComponent = {
    attach: (context, settings) => {...},
    detach: (context, settings, trigger) => {...},
  };
})(window.Drupal);
```

<br />
<br />

# 5. Exporting assets as JS module for Web Components <a id="5"></a>

With the `Harbor Asset Exporter` you can export the generated assets as a JS module. It can be used to preprocess your stylesheets so it can be included within a Web Component like [Lit Element](https://lit.dev/).

```bash
$ node node_modules/@toolbarthomas/harbor/index.js task=export
```

The Assets Exporter will export the configurated entries as `{entry}.asset.js` module. You can also export the assets source within a custom template literal within your configuration.

This example will import the `css` literal from Lit element that will be used within the module export.
Keep in mind that you need to resolve in a [relative path](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) if you include the literal locally.

```js
...
  AssetExporter: {
    entry: {
      css: '**/*.css' // Will resolve all css files from the THEME_DESTINATION path.
    }
    options: {
      includeLiteral: [
        {
          entry: 'css', // Should contain 1 of the entry keys within the entry configuration.
          import: 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/core/lit-core.min.js', // Should resolve to the dependency that has the css literal
          export: 'css', // The actual literal to use
        }
      ]
    }
  }
...
```

<br/>
<br/>

# 6. Implementing Lit Element within the Harbor structure <a id="6"></a>

With the following example you can include Lit element within your theme that should be also compatible with the Drupal structure.
We need to setup the Lit element dependencies first so it can be used in your template, the dependency will be assigned to each library:

```yml
lit-element:
  js:
    dist/vendors/@webcomponents/webcomponentsjs/webcomponents-loader.js: {}
    dist/vendors/@lit/reactive-element/polyfill-support.js/polyfill-support.js: {}

standalone-component:
  js:
    dist/components/standalone-components/index.js: { attributes: { type: 'module' } }
  dependencies:
    - my_theme/lit-element
```

Your component should include the required dependencies to ensure better Browser support. The component script should also be defined as module in order to use `import` and `export` statements.

The required Lit element dependencies are resolved by using the `Harbor Resolver` with the following configuration.

```js
...
  Resolver: {
    entry: {
      "@webcomponents/webcomponentsjs": "webcomponents-loader.js",
      "@lit/reactive-element/polyfill-support.js": "polyfill-support.js",
    },
  },
...
```

Next you can setup your component Javascript:

```js
import {
  LitElement,
  css,
  createRef,
  html,
  ref,
} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/all/lit-all.min.js';

// Import the generated AssetExporter entry for this custom element.
import stylesheet from './standalone-components.css.asset.js';

export class StandaloneComponent extends LitElement {
  constructor() {}

  static styles = css`
    ${stylesheet}
  `;

  render() {
    return html`<div class="standalone-component">...</div>`;
  }
}

customElements.define('standalone-component', StandaloneComponent);
```

This is just a simple example to setup a Lit Element, keep in mind that you can also load the required dependencies locally but you need to ensure the paths are relative to your component (absolute paths with the exception of URLS are not supported).

<br/>
<br/>

# 7. Using BackstopJS testing suite <a id="7"></a>

It is possible to run Snapshot tests with BackstopJS for all created Storybook stories.
Storybook first generates a stories manifest in order to define the components to test.
A temporary Storybook instance will be created afterwards, which BackstopJS will use for the snapshot tests.

First you need to create the reference tests for Backstop JS, the references are based on the created Storybook setup. This means that all stories that exists within Storybook will be tested; this also includes the generated stories that are created by using `$ node node_modules/@toolbarthomas/harbor/index.js --setup`.

```php
# Backstop will test the following story that can be inspected afterwards.
./src/styleguide/standalone-component.stories.js
```

```php
# Will generate a test reference to inspect at:

./backstopJS/backstopHTMLReport/HTMLreports/index.html
```
