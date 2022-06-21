/**
 * Filters out the defined keys from the given object or array.
 */
module.exports = (context, ...args) => {
  function without(props, ...args) {
    if (!args || !args.length) {
      return props;
    }

    if (Array.isArray(props)) {
      return props.filter((c) => !args.includes(c));
    }

    if (props instanceof Object) {
      const output = {};

      props.forEach((value, key) => {
        if (args.includes(key)) {
          return;
        }

        output[key] = value;
      });

      return output;
    }

    return props;
  }

  return Promise.resolve(without(context, ...args));
};
