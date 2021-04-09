const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const cwd = path.resolve(process.cwd(), '.storybook');

if (!fs.existsSync(cwd)) {
  mkdirp.sync(cwd);
}

const sources = [
  path.resolve(__dirname, '../.storybook/main.js'),
  path.resolve(__dirname, '../.storybook/preview.js'),
];

sources.forEach((source) => {
  const destination = path.resolve(cwd, path.basename(source));

  if (!fs.existsSync(destination)) {
    console.log(`Creating default styleguide configuration: ${source}`);

    fs.copyFileSync(source, destination);
  }
});
