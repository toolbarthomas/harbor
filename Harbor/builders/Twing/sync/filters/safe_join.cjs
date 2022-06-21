const { escape } = require('html-escaper');

module.exports = (context, key = ',') =>
  Array.isArray(context) && [...context].map((m) => escape(m)).join(key);
