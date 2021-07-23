const { escape } = require('html-escaper');

module.exports = (context, key = ',') => [...context].map((m) => escape(m)).join(key);
