const { escape } = require('html-escaper');

module.exports = (context, key = ',') =>
  Promise.resolve(context && [...context].map((m) => escape(m)).join(key));
