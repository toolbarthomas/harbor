const { existsSync } = require('fs');
const { join, relative } = require('path');
const copyfiles = require('copyfiles');
const Logger = require('./common/Logger');

/**
 * Copies all defined files to the `THEME_DIST` directory.
 */
class FileSync {
  constructor() {
    this.defaultEntries = ['main/webfonts', 'main/vendor', 'main/images'];
  }

  init(config) {
    this.cwd = relative(process.cwd(), config.THEME_SRC);
    this.dist = relative(process.cwd(), config.THEME_DIST);

    // Get the optional defined resource paths to sync.
    this.resourceEntries = FileSync.defineResourceEntries(config);

    /**
     * Resolve all defined path and apply the globbing pattern to sync all files
     * within that directory.
     */
    this.entries = FileSync.resolveEntries(this.defaultEntries.concat(this.resourceEntries));

    // Push the destination path
    this.entries.push(this.dist);

    // Sync the actual files.
    copyfiles(
      this.entries,
      {
        verbose: false,
        up: 1,
      },
      () => {
        Logger.success('FileSync Finished');
      }
    );
  }

  /**
   * Check if the defined resource path can be resolved form the cwd variable.
   * Also make sure if the actual path already has the working path defined.
   *
   * @param {Object} config The Harbor environment configuration.
   */
  static defineResourceEntries(config) {
    if (!config || !config.THEME_RESOURCES) {
      return null;
    }

    // Filter out non-existing paths.
    const entries = config.THEME_RESOURCES.split(',').map(t => {
      return t.trim();
    });

    return entries;
  }

  /**
   * Check if the working directory and the actual glob pattern are defined for
   * each existing entry path.
   *
   * @param {String} cwd The path of the working directory.
   * @param {Array} entries Array with all existing paths to sync.
   */
  static resolveEntries(cwd, entries) {
    let resolvedEntries = [...new Set(entries)];

    // Make sure the path is relative to the cwd path.
    resolvedEntries = resolvedEntries.map(entry => {
      if (entry) {
        return String(entry).startsWith(cwd) ? entry : join(cwd, entry);
      }
    });

    resolvedEntries = resolvedEntries.filter(entry => {
      return existsSync(entry) ? entry : false;
    });

    // Make sure the actual globbing path is defined.
    resolvedEntries = resolvedEntries.map(entry => {
      return String(entry).endsWith('/**') ? entry : `${entry}/**`;
    });

    return resolvedEntries;
  }
}

module.exports = FileSync;
