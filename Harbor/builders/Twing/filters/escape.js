const { escape } = require('html-escaper');

/**
 * Escapes the given HTML input.
 */
module.exports = (context) => {
  return escape(context);
};
