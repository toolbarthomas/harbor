const { escape } = require('html-escaper');

module.exports = (context) => `<em>${escape(context)}</em>`;
