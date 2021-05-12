const Environment = require('../common/Environment');
const Logger = require('../common/Logger');

class TaskManager {
  constructor() {
    this.instances = {
      plugins: {},
      workers: {},
    };

    const Env = new Environment();
    this.environment = Env.define();

    this.Console = new Logger(this.environment);
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
        return new Promise((resolve, reject) => {
          this.instances[type][name].resolve = resolve;

          return handler(args);
        });
      } catch (exception) {
        this.Console.error(exception);
      }
    };

    this.instances[type][name].fn = fn;
  }

  /**
   *
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
  async publish(type, hook) {
    if (!hook) {
      this.Console.warning('No task have been defined...');
      return;
    }

    const list = String(hook)
      .split(',')
      .map((t) => {
        return t.trim();
      });

    if (!list.length) {
      this.Console.warning('No task has been defined.');
      return;
    }

    const queue = list
      .filter((item, index) => list.indexOf(item) == index)
      .map((item) => {
        const tasks = Object.values(this.instances[type]).filter(
          (task) => Array.isArray(task.hook) && task.hook.includes(item)
        );

        if (!tasks.length) {
          return;
        }

        return {
          hook: item,
          tasks,
        };
      })
      .filter((t) => t);

    if (!queue.length) {
      this.Console.error(`Unable to find ${type}: ${list.join(', ')}`);

      return;
    }

    const jobs = [].concat.apply([], queue);
    const completed = [];
    const exceptions = [];

    const result = await Promise.all(
      jobs.map((job) =>
        new Promise(async (done) => {
          if (job.tasks && job.tasks.length) {
            this.Console.info(`Starting: ${job.hook}`);

            for (let i = 0; i < job.tasks.length; i++) {
              const { hook, fn } = job.tasks[i];

              this.Console.info(`Launching service: ${hook[0]}`);

              if (typeof fn === 'function') {
                await fn()
                  .then((exit) => {
                    if (!exit) {
                      completed.push(hook[0]);
                    } else {
                      exceptions.push(hook[0]);
                    }
                  })
                  .catch((exception) => this.Console.error(exception));
                this.Console.info(`Complete: ${hook[0]}`);
              } else {
                this.Console.warning(`No handler has been defined for ${job.task}`);
              }
            }

            done(`Done: ${job.hook}`);
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
    const environment = new Environment();
    const env = environment.define();

    if (!options) {
      return true;
    }

    if (!options.acceptedEnvironments || !options.acceptedEnvironments.length) {
      return true;
    }

    if (options.acceptedEnvironments.includes(env.THEME_ENVIRONMENT)) {
      return true;
    }

    return false;
  }
}

module.exports = TaskManager;