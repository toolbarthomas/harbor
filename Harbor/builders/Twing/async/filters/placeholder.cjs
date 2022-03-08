const { escape } = require('html-escaper');

module.exports = (context) => Promise.resolve(context && `<em>${escape(context)}</em>`);
