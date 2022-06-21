import Service from './Service.js';

class ConfigPublisher extends Service {
  constructor(acceptedServices) {
    super(acceptedServices);

    this.instances = {};
  }

  /**
   * Subscribes a new shared configuration object to the current class instance.
   *
   * @param {String} name The unique name for the subscribed instance.
   * @param {Object} config The configuration object to share.
   */
  subscribe(name, config) {
    if (!this.instances || this.instances[name]) {
      this.Console.warning(`Shared configuration already subscribed for ${name}`);
      return;
    }

    if (!(config instanceof Object)) {
      this.Console.log(
        `Unable to expose configuration for ${name}, no valid configuration Object has been defined.`
      );

      return;
    }

    this.Console.log(`Shared configuration defined for: ${name}`);

    this.instances[name] = config;
  }

  /**
   * Publishes the defined subscribed shared configuration if it exists.
   *
   * @param {String} name The configuration name to return.
   */
  publish(name) {
    if (!this.instances || !this.instances[name]) {
      this.Console.warning(
        `Unable to publish '${name}', no shared configuration has been defined.`
      );

      return {};
    }

    return this.instances[name];
  }

  /**
   * Returns a single option from the named subscription.
   *
   * @param {String} name Returns the option from existing subscription.
   * @param {String} option The name of the option to return.
   */
  getOption(name, option) {
    const instance = this.publish(name);

    if (!instance || !instance[option]) {
      this.Console.warning(`Unable to get undefined option '${option}' from '${name}'`);

      return null;
    }

    return instance[option];
  }
}

export default ConfigPublisher;
