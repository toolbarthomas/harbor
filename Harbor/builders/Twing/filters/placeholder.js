const escape = require('./escape');

module.exports = (context) => {
  return `<em>${escape(context)}</em>`;
};
