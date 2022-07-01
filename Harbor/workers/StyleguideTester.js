import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import glob from 'glob';
import http from 'http';
import os from 'os';
import path from 'path';
import YAML from 'yaml';

// @TODO should install within instance like the node-sass fallback.
import backstop from 'backstopjs';
import rimraf from 'rimraf';

import { Worker } from './Worker.js';

/**
 * Enables Snapshot testing for all valid Storybook stories.
 */
export class StyleguideTester extends Worker {
  async init() {
    const script = path.resolve(fileURLToPath(import.meta.url), '../../../index.js');
    const staticDirectory = this.getOption('staticDirectory');
    const outputPath = this.getOption('outputPath');
    const { THEME_DIST } = this.environment;
    const manifest = path.resolve(THEME_DIST, staticDirectory, outputPath);
    const initialCwd = path.resolve('node_modules/@storybook/cli/bin/index.js');
    const destinationDirectory = path.resolve(THEME_DIST, staticDirectory);
    let hasError = false;

    this.Console.log('Preparing test server...');

    // Prepare to build a new Storybook snapshot.
    try {
      execSync(`node ${script} --styleguide --isProduction --staticDirectory=${staticDirectory}`, {
        stdio: 'inherit',
      });
    } catch (exception) {
      this.Console.error(exception);

      return this.reject();
    }

    // Ensure the Storybook CLI script is resolved correctly.
    const cwd = fs.existsSync(initialCwd)
      ? initialCwd
      : path.resolve('../../@storybook/cli/bin/index.js');

    this.Console.info(`Extracting stories from ${destinationDirectory}`);

    // Extract the generated stories from the defined snapshot directory.
    execSync(`${cwd} extract ${destinationDirectory} ${manifest}`, {
      stdio: 'inherit',
    });

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

    const { excludeScenarios, scenarioDefaults, ...config } = this.getOption('backstopJS', {});

    const backstopConfig = {
      scenarios: [],
      ...config,
    };

    // Define the scenario from the generated Storybook instance.
    // @TODO Should implement option to test a single scenario.
    Object.values(stories).forEach((value) => {
      const url = `http://localhost:${this.parseEnvironmentProperty(
        this.environment.THEME_PORT
      )}/iframe.html?id=${value.id}`;

      if (Array.isArray(excludeScenarios) && excludeScenarios.includes(value.id)) {
        this.Console.log(`Excluding scenario: ${value.id}`);
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

    const customScenarios = glob.sync(`${this.getOption('scenarioDirectory')}/**/*.{json,yaml}`);
    if (customScenarios.length) {
      this.Console.info(`Importing ${customScenarios.length} backstopJS scenarios...`);

      customScenarios.forEach((customScenario) => {
        if (!fs.statSync(customScenario).size) {
          this.Console.log(`Skipping empty scenario: ${customScenario}`);
          return;
        }

        const extname = path.extname(customScenario);
        let scenarioConfig = {};
        const data = fs.readFileSync(customScenario).toString();
        let canImport = true;

        try {
          if (extname === '.yaml') {
            scenarioConfig = YAML.parse(data);
          } else {
            scenarioConfig = JSON.parse(data);
          }
        } catch (exception) {
          this.Console.error(`Unable to import custom scenario: ${customScenario}`);
          this.Console.error(exception);
          canImport = false;
        }

        // Ensure a scenario label is defined.
        if (!scenarioConfig.label) {
          scenarioConfig.label = path.basename(customScenario, extname);
        }

        if (canImport) {
          this.Console.info(`Inserted Custom scenario: ${customScenario}`);

          backstopConfig.scenarios.push({
            ...scenarioConfig,
            ...scenarioDefaults,
          });
        }
      });
    }

    this.Console.info(`Starting Snapshot server....`);

    // Setup a temporary Snapshot server to test the defined scenarios.
    const server = spawn('node', [script, '--styleguide', '--ci'], {
      detached: true,
    });

    // Mark the current instance as invalid in order to exit the process.
    server.on('error', () => {
      hasError = true;
    });

    // Await for the Styleguide server before the Snapshot tester can be
    // started.
    await this.awaitServer().catch(() => {
      this.reject();
    });

    const scenarioLength = backstopConfig.scenarios.length * backstopConfig.viewports.length;
    this.Console.log(`Testing ${scenarioLength} scenarios.`);

    // Select the supported Backstopjs command, it should be adjusted within
    // the plugin definition value e.g.: harbor --styleguide=refernece
    const command = ['approve', 'reference'].includes(this.environment.THEME_TEST_PHASE)
      ? this.environment.THEME_TEST_PHASE
      : 'test';

    this.Console.log(`Starting test suite: ${this.environment.THEME_TEST_PHASE}`);

    await backstop(command, { config: backstopConfig }).catch((exception) => {
      if (exception) {
        hasError = true;
        this.Console.error(exception);
      }
    });

    // Ensure the whole process group is terminated to prevent duplicate
    // instances after multiple tests.
    process.kill(-server.pid);

    server.on('close', () => {
      if (fs.existsSync(destinationDirectory)) {
        this.Console.log(`Removing previous styleguide build: ${destinationDirectory}`);

        rimraf(destinationDirectory, () => {
          if (hasError) {
            this.Console.warning(`Backstop test has failed since it encountered some errors`);
            // Reject afterwards so we can close any instances within the Worker scope.
            super.reject();

            return process.exit(1);
          }

          return super.resolve();
        });
      }
    });

    return null;
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
              port: this.parseEnvironmentProperty('THEME_PORT'),
            },
            (response) => {
              response.on('data', () => {
                this.Console.log('Connection established with the Snapshot server.');
              });

              response.on('end', () => {
                this.Console.log(`Found Snapshot server at take: ${take}`);

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
