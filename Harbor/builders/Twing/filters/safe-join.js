const escape = require('./escape');

module.exports = (context, key = ',') => {
  return [...context].map((m) => escape(m)).join(key);
};
