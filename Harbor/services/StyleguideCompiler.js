const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');

const BaseService = require('./BaseService');

class StyleguideCompiler extends BaseService {
  constructor() {
    super();
  }

  init(environment) {
    if (!this.config.entry instanceof Object) {
      return;
    }

    const stories = [].concat.apply(
      [],
      Object.values(this.config.entry).map((entry) =>
        glob.sync(path.join(environment.THEME_SRC, entry)).map((e) => path.resolve(e))
      )
    );

    const webpackFinal = (config) => {
      config.module.rules.push({
        test: /\.twig$/,
        loader: 'twing-loader',
        options: {
          environmentModulePath: path.resolve(__dirname, '../builders/', 'twing.js'),
        },
      });
      config.plugins.forEach((plugin, i) => {
        if (plugin.constructor.name === 'ProgressPlugin') {
          config.plugins.splice(i, 1);
        }
      });

      return config;
    };

    const addons =
      this.config.options && this.config.options.addons ? this.config.options.addons || [] : [];

    return {
      stories,
      addons,
      webpackFinal,
    };
  }
}

module.exports = StyleguideCompiler;
