# Creating Drupal 8+ compatible environments within Harbor

This document contains some basic information on how you can setup a styleguide environment that is compatible with the Twig template that will be used within your Drupal environment.

1. [Creating custom Twig Templates](#tips-1)
2. [About the Drupal variable usage](#tips-2)
3. [Twig Usage](#tips-3)
4. [Generating Storybook stories from existing Twig templates](#tips-4)
5. [Including assets via attach_library Twig function](#tips-5)
6. [Exporting assets as JS module to Web Components](#tips-6)
7. [Implementing Lit element within the Harbor structure](#tips-7)
8. [Using BackstopJS testing suite](#tips-8)

<br />
<br />

# 1. Creating custom Twig Templates <a id="tips-1"></a>

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

# 2. About the Drupal variable usage <a id="tips-2"></a>

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

# 3. Twig Usage

Harbor has included support for the available Twig functions that are available for Drupal 8 & 9. It uses the Twing NPM package in order to use the Twig Syntax within the Storybook environment and it should match with the Drupal API.

You could use these Drupal specific filters & functions within Storybook but keep in mind that some of them just return the original value; since they don't add any specific markup to the templates and we want to keep it clean as possible.

See [Twig Functions](https://twig.symfony.com/doc/2.x/functions/index.html) & [Twig Filters](https://twig.symfony.com/doc/2.x/filters/index.html) for more information about the default Twig functionalities.

Get more information about the Drupal specific [Filters](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/filters-modifying-variables-in-twig-templates) & [Functions](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/functions-in-twig-templates)

### Usable filters

The following filters can be used and should output the same output as it's Drupal counterpart:

1. format_date - This filter should return the formatted date from the defined string. It is an actual alias for the date filter.
2. placeholder - Should wrap the defined String parameter in an emphasis tag.
3. safe_join - The safe_join filter joins several strings together with a supplied separator.
4. without - The without filter creates a copy of the renderable array and removes child elements by key specified through arguments passed to the filter. The copy can be printed without these elements. The original renderable array is still available and can be used to print child elements in their entirety in the twig template.

### Usable functions

The following function can be used and should output the same output as it's Drupal counterpart:

1. add_svg - Generates markup to display an inline-svg element.
2. attach_library - Function that should include the configured library assets to the template. [More information](https://www.drupal.org/docs/theming-drupal/adding-assets-css-js-to-a-drupal-theme-via-librariesyml)
3. svg_path - This is an actual alias for `add_svg`.

### Mocking filters

The mocking filter ignores the defined function parameters and will return the inital value directly.

1. clean_class - This filter prepares a string for use as a valid HTML class name.
2. clean_id - This filter prepares a string for use as a valid HTML ID.
3. drupal_escape - This filter should escape the defined string. It is an actual alias for the escape filter.
4. render - This filter is a wrapper for the render() function. It takes a render array and outputs rendered HTML markup. This can be useful if you want to apply an additional filter (such as stripping tags), or if you want to make a conditional based on the rendered output (for example, if you have a non-empty render array that returns an empty string). It also can be used on strings and certain objects, mainly those implementing the toString() method.
5. trans - This filter (alternatively, t) will run the variable through the Drupal t() function, which will return a translated string. This filter should be used for any interface strings manually placed in the template that will appear for users.
6. t - This filter (alternatively, trans) will run the variable through the Drupal t() function, which will return a translated string. This filter should be used for any interface strings manually placed in the template that will appear for users.

### Mocking functions

The mocking function ignores the defined function parameters and will return the inital value directly.

1. active_theme - Prints the machine name of the active theme.
2. active_theme_path - Prints the relative path to the active theme.
3. create_attribute - Create new Attribute objects using the `create_attribute()` function inside a Twig template. These objects can then be manipulated just like other Attribute objects coming into the Twig template.
4. file_url - This helper function accepts a URI to a file and creates a relative URL path to the file.
5. link - This helper function accepts as the first parameter the text and as the second parameter the URI. The optional third parameter is the attributes object that can be used to provide eg. additional CSS classes.
6. path - Generates a `relative` URL path given a route name and parameters.
7. render_var - Convenience function around render().
8. url - Generate an absolute URL given a route name and parameters:

####

<br />
<br />

# 4. Generating Storybook stories from the existing templates <a id="tips-4"></a>

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

# 5. Including assets via attach_library Twig function <a id="tips-5"></a>

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

Adding Javascript files is also possible, but keep in mind that you want to define the script within the [Drupal](https://drupaljs.net/Drupal.html) Javascript as possible.

### global.

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

# 6. Exporting assets as JS module for Web Components <a id="tips-6"></a>

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

# 7. Implementing Lit Element within the Harbor structure <a id="tips-7"></a>

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

# 8. Using BackstopJS testing suite <a id="tips-8"></a>

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
