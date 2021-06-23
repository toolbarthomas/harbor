import Environment from '../common/Environment.js';
import Logger from '../common/Logger.js';

export default class TaskManager {
  constructor() {
    this.instances = {
      plugins: {},
      workers: {},
    };

    const Env = new Environment();
    this.environment = Env.define();

    this.Console = new Logger(this.environment);
  }

  workerHooks() {
    if (!this.instances || !this.instances.workers) {
      return [];
    }

    const hooks = Object.keys(this.instances.workers)
      .map((plugin) => this.instances.workers[plugin].hook)
      .filter((plugin) => plugin)
      .flat();

    return hooks;
  }

  /**
   * Subscribes a new task to the current TaskManager instance.
   *
   * @param {string} name The unique name of the service.
   * @param {string[]} hook Initiates the defined handler if the hook is used during
   * the publish method.
   * @param {function} handler The function that will be initiated during the
   * publish.
   * @param  {...any} args Optional handler arguments.
   */
  subscribe(type, name, hook, handler, ...args) {
    if (this.instances[type][name]) {
      this.Console.warning(`${name} is already registerd as task`);
      return;
    }

    this.Console.log(`Subscribing ${name} within ${type} with hook: ${hook.join(', ')}`);

    this.instances[type][name] = {
      hook,
    };

    const fn = () => {
      try {
        return new Promise((resolve) => {
          this.instances[type][name].resolve = resolve;

          return handler(args);
        });
      } catch (exception) {
        this.Console.error(exception);
      }

      return null;
    };

    this.instances[type][name].fn = fn;
  }

  /**
   * Marks the current task as resolved.
   */
  resolve(type, name, exit) {
    if (!this.instances[type][name]) {
      this.Console.warning(`Unable to resolve non existing task: ${name}`);
      return;
    }

    if (!this.instances[type][name].resolve) {
      this.Console.warning(`No resolve handler has been defined for: ${name}`);
    }

    this.instances[type][name].resolve(exit);
  }

  /**
   * Initiates the subscribed handlers from the given hook. Each hook will
   * concurrently run each service in a sequential order.
   *
   * @param {string[]} hook Initialtes the subscribed handlers from the given hooks.
   */
  async publish(type, name) {
    if (!name) {
      this.Console.warning('No task have been defined...');

      return null;
    }

    const list = String(name)
      .split(',')
      .map((t) => t.trim());

    if (!list.length) {
      this.Console.warning('No task has been defined.');

      return null;
    }

    const queue = list
      .filter((item, index) => list.indexOf(item) === index)
      .map((item) => {
        const entries = new Map();

        // Define the optional order if the hook has been marked with the twin
        // double collon :: flag.
        // E.g. hook::0, hook::1, hook::2
        Object.values(this.instances[type]).forEach((task) => {
          if (!Array.isArray(task.hook)) {
            return;
          }

          const triggers = task.hook.map((h) => h.split('::')[0]);

          if (!triggers.includes(item)) {
            return;
          }

          const order =
            parseInt(
              (task.hook.filter((h) => h.split('::') && h.split('::')[1])[0] || '').split('::')[1],
              2
            ) || 0;

          const key = entries.has(order) ? order + 1 : order;

          entries.set(key, task);
        });

        // Ensure the tasks queue is sorted according to the optional index value.
        const tasks = [...entries.keys()].sort((a, b) => a - b).map((entry) => entries.get(entry));

        if (!tasks.length) {
          return null;
        }

        return {
          hook: item,
          tasks,
        };
      })
      .filter((t) => t);

    if (!queue.length) {
      this.Console.error(
        `Unable to start ${type}, no hook has been defined for: ${list.join(', ')}`
      );

      return null;
    }

    const jobs = [...queue];
    const completed = [];
    const exceptions = [];

    await Promise.all(
      jobs.map((job) =>
        new Promise((done) => {
          if (job.tasks && job.tasks.length) {
            this.Console.info(`Starting: ${job.hook}`);

            for (let i = 0; i < job.tasks.length; i += 1) {
              const { hook, fn } = job.tasks[i];

              this.Console.log(`Launching task: ${hook[0]}`);

              if (typeof fn === 'function') {
                fn()
                  .then((exit) => {
                    if (!exit) {
                      completed.push(hook[0]);
                    } else {
                      exceptions.push(hook[0]);
                    }

                    done(`Done: ${job.hook}`);
                  })
                  .catch((exception) => {
                    this.Console.error(exception);

                    done(`Done: ${job.hook}`);
                  });
                this.Console.log(`Complete: ${hook[0]}`);
              } else {
                this.Console.warning(`No handler has been defined for ${job.task}`);
              }
            }
          }
        }).then((message) => message && this.Console.success(message))
      )
    );

    return {
      completed,
      exceptions,
    };
  }

  /**
   * Prevents the execution if the current environment is not included
   * within the acceptedEnvironments option.
   */
  initIfAccepted(options) {
    if (!options) {
      return true;
    }

    if (!options.acceptedEnvironments || !options.acceptedEnvironments.length) {
      return true;
    }

    if (options.acceptedEnvironments.includes(this.environment.THEME_ENVIRONMENT)) {
      return true;
    }

    return false;
  }
}
