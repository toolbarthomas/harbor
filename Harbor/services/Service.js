export class Service {
  constructor(acceptedServices) {
    this.name = this.constructor.name;

    this.acceptedServices = acceptedServices || [];
  }

  /**
   * Mounts the defined services to the current Class instance.
   *
   * @param {String} name The name of the mounted service.
   * @param {Service} service The handler of the mounted service.
   */
  mount(name, service) {
    if (name && !this[name] && this.acceptedServices.includes(name)) {
      this[name] = service;
    }

    if (this.Console && this.Console.log) {
      this.Console.log(`Assigning ${name} to ${this.name}...`);
    }
  }
}
