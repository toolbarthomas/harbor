const path = require('path');
const glob = require('glob');

const Harbor = require(path.resolve(__dirname, '../Harbor/index.js'));
const instance = new Harbor();

const styleguide = instance.styleguide(instance.getEnvironment());

module.exports = styleguide;
