export class Service {
  constructor(acceptedServices) {
    this.name = this.constructor.name;

    this.acceptedServices = acceptedServices || [];
  }

  /**
   * Mounts the defined Core service to the current Service.
   *
   * @param {String} name The name of the mounted service.
   * @param {any} instance The handler of the mounted service.
   */
  mount(name, service) {
    if (name && !this[name] && this.acceptedServices.includes(name)) {
      this[name] = service;
    }

    if (this.Console && this.Console.info) {
      this.Console.log(`${name} assigned: ${this.name}`);
    }
  }
}
