import Service from './Service.js';

class TaskManager extends Service {
  constructor(acceptedServices) {
    super(acceptedServices);

    this.instances = {
      plugins: {},
      workers: {},
    };
  }

  /**
   * Returns the hooks of the subscribed workers.
   */
  workerHooks() {
    return this.hooks('workers');
  }

  /**
   * Returns the hooks of the subscribed plugins.
   */
  pluginHooks() {
    return this.hooks('plugins');
  }

  /**
   * Returns an flat array with all the subscribed hook of the defined instance.
   *
   * @param {string} type Returns the hooks of the defined instance.
   */
  hooks(type) {
    if (!this.instances || !this.instances[type]) {
      return [];
    }

    const hooks = Object.keys(this.instances[type])
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

          handler(args);
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
  async publish(type, name, initialTasks) {
    if (!name) {
      this.Console.warning('No task have been defined...');

      return null;
    }

    const list = String(name)
      .split(',')
      .filter((t) => t.toLowerCase() !== 'true' && t.toLowerCase() !== 'false')
      .filter((t) => typeof t === 'string')
      .map((t) => t.trim());

    if (!list.length) {
      this.Console.warning('No task has been defined.');

      return null;
    }

    // Defines a non existing index key for the defined entries Map.
    const increment = (key, collection) => {
      if (collection.has(String(key))) {
        return increment(key + 1, collection);
      }

      return key;
    };

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

          const triggers = task.hook.map((h) => h && h.split('::')[0]);

          if (!triggers.includes(item)) {
            return;
          }

          const order =
            parseInt(
              (task.hook.filter((h) => h && h.split('::') && h.split('::')[1])[0] || '').split(
                '::'
              )[1],
              10
            ) || 0;

          const key = increment(order, entries);

          entries.set(String(key), task);
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

    const jobs = [].concat(...queue).map((job) => {
      if (!initialTasks || !initialTasks.length) {
        return job;
      }

      // Ensure the current job hooks are present within the defined tasks.
      const filteredTasks = job.tasks.filter((tt) => {
        if (
          ![]
            .concat(...initialTasks.map((t) => t.split(',')))
            .filter((initialTask) => tt.hook.includes(initialTask)).length
        ) {
          return null;
        }

        return tt;
      });

      return {
        tasks: filteredTasks,
        hook: job.hook,
      };
    });

    const completed = [];
    const exceptions = [];

    const postRun = (exit, n) => {
      if (!exit) {
        this.Console.info(`Done: ${n}`);

        completed.push(n);
      } else {
        exceptions.push(n);
      }
    };

    await jobs.reduce(
      (instance, job) =>
        instance.then(async () => {
          // Ensures the process to wait for all parallel tasks to complete
          // before the next job can continue.
          const JIT = [];

          const { hook, tasks } = job;

          if (tasks.length) {
            this.Console.log(`Starting: ${hook}`);
          }

          for (let i = 0; i < tasks.length; i += 1) {
            const task = tasks[i];

            this.Console.info(`Launching: ${task.hook[0]}`);

            if (type === 'plugins' || !task.hook.filter((h) => h.indexOf('::') > 0).length) {
              // Collects the callback within the JIT for the current asynchronous
              // job to ensure it is not finished before all parallel tasks are
              // finished.

              if (type === 'plugins') {
                task.fn().then((exit) => postRun(exit, task.hook[0]));
              } else {
                JIT.push(
                  new Promise((cc) => {
                    task.fn().then((exit) => {
                      postRun(exit, task.hook[0]);

                      cc();
                    });
                  })
                );
              }
            } else {
              // @TODO: Await needs to return directly within the upper scope
              // otherwise it would initiate grouped tasks in paralel.
              //
              // eslint-disable-next-line no-await-in-loop
              await task.fn().then((exit) => postRun(exit, task.hook[0]));
            }
          }

          if (JIT.length) {
            await Promise.all(JIT);

            this.Console.log(`Hook completed: ${hook}`);
          }
        }),
      Promise.resolve()
    );

    return {
      completed,
      exceptions,
    };
  }

  publishPlugins(name, tasks) {
    return this.publish('plugins', name, tasks);
  }

  publishWorkers(name) {
    return this.publish('workers', name);
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

export default TaskManager;
