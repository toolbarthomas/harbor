/**
 * Returns the given context in a default Date formate
 */
module.exports = (context) => {
  return new Date(context).toDateString();
};
