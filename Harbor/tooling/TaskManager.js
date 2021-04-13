const Environment = require('../common/Environment');
const Logger = require('../common/Logger');

class TaskManager {
  constructor() {
    this.tasks = {};

    const environment = new Environment();
    this.environment = environment.define();

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
  subscribe(name, hook, handler, ...args) {
    if (this.tasks.name) {
      this.Console.warning(`${name} is already registerd as task`);
      return;
    }

    this.Console.log(`Assigning task: ${name} => ${hook.join(', ')}`);

    this.tasks[name] = {
      hook,
    };

    const fn = () =>
      new Promise((resolve) => {
        this.tasks[name].resolve = resolve;

        return handler(args);
      }).catch((exception) => this.Console.error(exception));

    this.tasks[name].fn = fn;
  }

  resolve(name, ...args) {
    if (!this.tasks[name]) {
      this.Console.warning(`Unable to resolve non existing task: ${name}`);
      return;
    }

    if (!this.tasks[name].resolve) {
      this.Console.warning(`No resolve handler has been defined for: ${name}`);
    }

    this.tasks[name].resolve(args);
  }

  /**
   * Initiates the subscribed handlers from the given hook. Each hook will
   * concurrently run each service in a sequential order.
   *
   * @param {string[]} hook Initialtes the subscribed handlers from the given hooks.
   */
  async publish(hook) {
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
      this.Console.warning('No tasks have been defined');
      return;
    }

    const queue = list
      .filter((item, index) => list.indexOf(item) == index)
      .filter((item) => item !== 'watch')
      .map((item) => {
        const tasks = Object.values(this.tasks).filter(
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
      this.Console.warning(`No tasks have been defined to launch.`);
      return;
    }

    const jobs = [].concat.apply([], queue);
    const completed = [];

    // Run each
    await Promise.all(
      jobs.map((job) =>
        new Promise(async (done) => {
          if (job.tasks && job.tasks.length) {
            this.Console.info(`Starting task: ${job.hook}`);

            for (let i = 0; i < job.tasks.length; i++) {
              const { hook, fn } = job.tasks[i];

              this.Console.info(`Launching: ${hook[0]}`);

              if (typeof fn === 'function') {
                await fn();
                this.Console.info(`Done: ${hook[0]}`);

                completed.push(hook[0]);
              } else {
                this.Console.warning(`No handler has been defined for ${job.task}`);
              }
            }

            done(`Complete: ${job.hook}`);
          }
        }).then((message) => message && this.Console.success(message))
      )
    );

    if (completed.length) {
      this.Console.success(
        `Successfully completed ${
          completed.filter((item, index) => completed.indexOf(item) == index).length
        } tasks`
      );
    }
  }
}

module.exports = TaskManager;
