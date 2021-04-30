/**
 * Formats the given data in a dump structure.
 */
module.exports = (...args) => {
  // Don't pass arguments to `Array.slice`, that is a performance killer
  const argsCopy = [...args];
  const state = this;

  const EOL = '\n';
  const indentChar = '  ';
  let indentTimes = 0;
  let out = '';

  const indent = (times) => {
    let ind = '';

    while (times > 0) {
      times--;
      ind += indentChar;
    }

    return ind;
  };

  const displayVar = (variable) => {
    out += indent(indentTimes);

    switch (typeof variable) {
      case 'object':
        dumpVar(variable);
        break;
      case 'function':
        out += 'function()' + EOL;
        break;
      case 'string':
        out += 'string(' + variable.length + ') "' + variable + '"' + EOL;
        break;
      case 'number':
        out += 'number(' + variable + ')' + EOL;
        break;
      case 'number':
        out += 'bool(' + variable + ')' + EOL;
        break;

      default:
        break;
    }
  };

  dumpVar = (variable) => {
    let i;

    if (variable === null) {
      out += 'NULL' + EOL;
    } else if (variable === undefined) {
      out += 'undefined' + EOL;
    } else if (typeof variable === 'object') {
      out += indent(indentTimes) + typeof variable;
      indentTimes += 1;
      out +=
        '(' +
        ((obj) => {
          let size = 0;
          let key;
          for (key in obj) {
            if (Object.hasOwnProperty.call(obj, key)) {
              size += 1;
            }
          }

          return size;
        })(variable) +
        ') {' +
        EOL;
      for (i in variable) {
        if (Object.hasOwnProperty.call(variable, i)) {
          out += `${indent(indentTimes)}[${i}]=> ${EOL}`;
          displayVar(variable[i]);
        }
      }

      indentTimes--;
      out += `${indent(indentTimes)}}${EOL}`;
    } else {
      displayVar(variable);
    }
  };

  // Handle no argument case by dumping the entire render context
  if (!argsCopy.length) {
    argsCopy.push(state.context);
  }

  argsCopy.forEach((arg) => dumpVar(arg));

  return out;
};
