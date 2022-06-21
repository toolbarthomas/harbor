/**
 * Returns the given context in a default Date format.
 */
module.exports = (context) => {
  if (!context) {
    return Promise.resolve();
  }

  let d = context;

  try {
    d = new Date(context).toDateString();
  } catch (error) {
    if (error) {
      return Promise.resolve(`${error}:${context}`);
    }
  }

  return Promise.resolve(d);
};
