const { join, relative } = require('path');
const copyfiles = require('copyfiles');
const Logger = require('./common/Logger');

/**
 * Copies all defined files to the `THEME_DIST` directory.
 */
class FileSync {
  constructor() {
    this.defaultEntries = [];
  }

  init(config) {
    this.config = config;

    this.cwd = relative(process.cwd(), this.config.THEME_SRC);
    this.dist = relative(process.cwd(), this.config.THEME_DIST);

    // Get the optional defined resource paths to sync.
    this.resourceEntries = this.defineResourceEntries();

    /**
     * Resolve all defined path and apply the globbing pattern to sync all files
     * within that directory.
     */
    this.entries = this.resolveEntries(this.defaultEntries.concat(this.resourceEntries));

    // Push the destination path
    this.entries.push(this.dist);

    Logger.info('Starting filesync...');

    // Sync the actual files.
    copyfiles(
      this.entries,
      {
        verbose: false,
        up: 1,
      },
      () => {
        Logger.success('FileSync finished.');
      }
    );
  }

  /**
   * Check if the defined resource path can be resolved form the cwd variable.
   * Also make sure if the actual path already has the working path defined.
   */
  defineResourceEntries() {
    if (!this.config || !this.config.THEME_STATIC_DIRECTORIES) {
      return null;
    }

    // Filter out non-existing paths.
    const entries = this.config.THEME_STATIC_DIRECTORIES.split(',').map(t => {
      return t.trim();
    });

    return entries;
  }

  /**
   * Check if the working directory and the actual glob pattern are defined for
   * each existing entry path.
   *
   * @param {Array} entries Array with all existing paths to sync.
   */
  resolveEntries(entries) {
    let resolvedEntries = [...new Set(entries)];

    // Exclude any empty entries.
    resolvedEntries = resolvedEntries.filter(entry => {
      return entry;
    });

    // Make sure the path is relative to the cwd path.
    resolvedEntries = resolvedEntries.map(entry => {
      return String(entry).startsWith(this.cwd) ? entry : join(this.cwd, entry);
    });

    // Make sure the actual globbing path is defined.
    resolvedEntries = resolvedEntries.map(entry => {
      return String(entry).indexOf('*') < 0 ? `${entry}/**` : entry;
    });

    return resolvedEntries;
  }
}

module.exports = FileSync;
