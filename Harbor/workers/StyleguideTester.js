import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import os from 'os';

// @TODO should install within instance like the node-sass fallback.
import backstop from 'backstopjs';

import Worker from './Worker.js';

/**
 * Enables Snapshot testing for all valid Storybook stories.
 */
class StyleguideTester extends Worker {
  async init() {
    const script = path.resolve(fileURLToPath(import.meta.url), '../../../index.js');
    const { staticDirectory, outputPath } = this.config.options;
    const { THEME_DIST } = this.environment;
    const manifest = path.resolve(THEME_DIST, staticDirectory, outputPath);
    const initialCwd = path.resolve('node_modules/@storybook/cli/bin/index.js');
    let hasError = false;

    this.Console.log('Preparing test server...');

    // Prepare to build a new Storybook snapshot.
    try {
      execSync(`node ${script} --styleguide --isProduction --renderDirectory=${staticDirectory}`, {
        stdio: 'ignore',
      });
    } catch (exception) {
      this.Console.error(exception);

      return this.reject();
    }

    // Ensure the Storybook CLI script is resolved correctly.
    const cwd = fs.existsSync(initialCwd)
      ? initialCwd
      : path.resolve('../../@storybook/cli/bin/index.js');

    this.Console.info(`Extracting stories from ${path.resolve(THEME_DIST, staticDirectory)}`);

    // Extract the generated stories from the defined snapshot directory.
    execSync(`${cwd} extract ${path.resolve(THEME_DIST, staticDirectory)} ${manifest}`);

    if (!fs.existsSync(manifest)) {
      this.Console.error(`Unable to load stories manifest: ${manifest}`);
      return this.reject();
    }

    let json;
    try {
      json = JSON.parse(fs.readFileSync(manifest).toString());
    } catch (exception) {
      if (exception) {
        this.Console.error(exception);
        return this.reject();
      }
    }

    const { stories } = json;
    if (!stories) {
      this.Console.warning(`No stories are found from ${manifest}`);
    }

    this.Console.info('Successfully prepared all required assets, creating snapshots...');

    const { excludeScenarios, scenarioDefaults, ...config } = this.config.options.backstopJS || {};

    const backstopConfig = {
      scenarios: [],
      ...config,
    };

    // @TODO should implement option to test a single scenario.
    Object.values(stories).forEach((value) => {
      const url = `http://localhost:${this.environment.THEME_PORT}/iframe.html?id=${value.id}`;

      if (Array.isArray(excludeScenarios) && excludeScenarios.includes(value.id)) {
        this.Console.info(`Excluding scenario: ${value.id}`);
        return;
      }

      if (backstopConfig.scenarios.filter((s) => s.url === url).length > 0) {
        return;
      }

      backstopConfig.scenarios.push({
        label: value.id,
        url,
        ...scenarioDefaults,
      });
    });

    // return this.reject();

    this.Console.info(`Starting Snapshot server....`);

    // Setup a temporary Snapshot server to test the defined scenarios.
    const server = spawn('node', [script, '--styleguide', '--ci']);

    server.on('error', () => {
      hasError = true;
    });

    await this.awaitServer().catch(() => {
      this.reject();
    });

    const scenarioLength = backstopConfig.scenarios.length * backstopConfig.viewports.length;
    this.Console.info(`Testing ${scenarioLength} scenarios.`);

    // Select the supported Backstopjs command, it should be adjusted within
    // the plugin definition value e.g.: harbor --styleguide=refernece
    const command = ['approve', 'reference'].includes(this.environment.THEME_TEST_PHASE)
      ? this.environment.THEME_TEST_PHASE
      : 'test';

    this.Console.info(`Starting test suite: ${command}`);

    await backstop(command, { config: backstopConfig }).catch((exception) => {
      if (exception) {
        hasError = true;
        this.Console.error(exception);
      }
    });

    server.stdin.pause();
    server.kill();

    // Reject afterwards so we can close any instances within the Worker scope.
    if (hasError) {
      super.reject();

      return process.exit(1);
    }

    return super.resolve();
  }

  /**
   * Tests if the required styleguide development server is operational.
   */
  async awaitServer() {
    this.Console.log(`Awaiting styleguide server...`);

    const maxTakes = 512 / os.cpus().length || 2;
    let instance;

    return new Promise((resolve, reject) => {
      const initRequest = (take, delay) => {
        clearTimeout(instance);
        instance = setTimeout(() => {
          const request = http.request(
            {
              host: 'localhost',
              path: '/iframe.html',
              port: this.environment.THEME_PORT,
            },
            (response) => {
              response.on('data', () => {
                this.Console.log('Connection established with the Snapshot server.');
              });

              response.on('end', () => {
                this.Console.info(`Found Snapshot server at take: ${take}`);

                resolve();
              });
            }
          );

          request.on('error', () => {
            if (take <= maxTakes) {
              initRequest(take + 1, 200);
            } else {
              this.Console.error(
                `Unable to connect to the snapshot server, reached the maximum amount of: ${maxTakes}.`
              );

              reject();
            }
          });

          request.end();
        }, delay || 0);
      };

      initRequest(0);
    });
  }
}

export default StyleguideTester;
