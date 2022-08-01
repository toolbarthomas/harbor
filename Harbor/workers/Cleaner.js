import rimraf from 'rimraf';
import fs from 'fs';
import path from 'path';

import { Worker } from './Worker.js';

/**
 * Clears the defined environment destination directory.
 */
export class Cleaner extends Worker {
  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  async init() {
    if (this.environment) {
      this.path = path.resolve(this.environment.THEME_DIST);

      if (fs.existsSync(this.path)) {
        this.Console.log(`Cleaning directory: ${this.path}`);

        rimraf(this.path, () => {
          this.Console.log(`Directory cleaned: ${this.path}`);

          super.resolve();
        });
      } else {
        this.Console.log(`${this.path} does not exist and will not be cleared.`);

        super.resolve();
      }
    }
  }
}
