const { escape } = require('html-escaper');

module.exports = (context) => context && `<em>${escape(context)}</em>`;
