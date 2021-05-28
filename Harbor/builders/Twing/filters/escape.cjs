const { escape } = require('html-escaper');

/**
 * Escapes the given HTML input.
 */
module.exports = (context) => escape(context);
