# Harbor updates

The following document keeps track of any breaking change that was created during the upgrade of any main dependency:

### Implementing templates since >=0.700.0

The Storybook environment has been upgraded to V7 since version 0.700.0. Some modifications are required in order correctly render your Harbor composed stories. If you are currently using Harbor below 0.100.0 then you also need replace the CommonJS requires with the ESM supported import syntax.

**Note:** There is currently an issue with the SVG related Twig functions since they don't output the width and height attributes within the Twig render. Setting these values are not required according to the W3C specification. Setting these attributes conflict with the method the elements are implemented; "as inline SVG sprite images that can is styled according to the css". You can safely ignore these errors/warnings since they should not affect the render result. You should file an issue within the Harbor repository if you still encounter an issue within 0.700.0+

```js
// example.stories.js

import Template from 'template.twig';

export default {
  title: 'Example template',
  loaders: [
    async ({ args }) => {
      Template: await Template(args); // Keyname can be anything.
    },
  ],
};

export const Template = {
  // Before 0.700.0 we would use the actual render handler directly within our named export definition.
  render: (args, { loaded }) => loaded.Template,
}
// Instead of:
// export const Template = (args, { loaded }) => loaded.Template.
```

### Implementing templates since >=0.100.0 && <=0.300.0

As of version 0.100.0 you need to define your Twing templates within the Storybook `loaders` configuration. This is required in order to display the actual templates; since they are rendered in asynchronous order:

```js
// example.stories.js

import Template from 'template.twig';

export default {
  title: 'Example template',
  loaders: [
    async ({ args }) => {
      Template: await Template(args); // Keyname can be anything.
    },
  ],
};

// loaded.Templates is defined within the default default export.
export const Default = (args, { loaded }) = > loaded.Template;

// Define the actual arguments
Default.args = {
  title: 'Foo',
};
```

```twig
{{ title }}
```
