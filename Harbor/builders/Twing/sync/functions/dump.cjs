const stringifyObject = require('stringify-object');
const typeName = require('type-name');

/**
 * Formats the given data in a dump structure.
 */
module.exports = (...args) =>
  stringifyObject(args, {
    indent: '  ',
    singleQuotes: false,
    transform: (obj, prop, originalResult) => `[${typeName(obj[prop])}] => ${originalResult}`,
  });
