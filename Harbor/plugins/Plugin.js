const Core = require('../common/Core');

class Plugin extends Core {
  constructor(services, options) {
    super(services, options, 'plugins');
  }
}

module.exports = Plugin;
