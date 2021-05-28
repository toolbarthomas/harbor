/**
 * Filters out the defined keys from the given object or array.
 */
module.exports = (context, ...args) => {
  if (!args || !args.length) {
    return context;
  }

  if (Array.isArray(context)) {
    return context.filter((c) => !args.includes(c));
  }

  if (context instanceof Object) {
    return Object.keys(context).reduce((acc, current) => {
      if (!args.includes(current)) {
        acc[current] = context[current];
      }

      return acc;
    }, {});
  }
};
