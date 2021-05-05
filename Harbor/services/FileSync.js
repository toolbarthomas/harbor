const copyfiles = require('copyfiles');
const { existsSync, statSync } = require('fs');
const { join, relative } = require('path');

const Logger = require('../common/Logger');
const BaseService = require('./BaseService');

/**
 * Synchronizes the configured Filesync entries to the defined environment
 * destination directory.
 */
class FileSync extends BaseService {
  constructor(tooling) {
    super(tooling);

    this.defaultPatterns = [];
    this.resourcePatterns = [];
  }

  /**
   * The initial handler that will be called by the Harbor TaskManager.
   */
  init() {
    super.init();

    this.cwd = relative(process.cwd(), this.environment.THEME_SRC);
    this.dist = relative(process.cwd(), this.environment.THEME_DIST);

    // Get the optional defined resource paths to sync.
    this.defineResourcePatterns();

    /**
     * Resolve all defined path and apply the globbing pattern to sync all files
     * within that directory.
     */
    this.patterns = this.resolvePatterns(this.defaultPatterns.concat(this.resourcePatterns));

    // Push the destination path
    this.patterns.push(this.dist);

    this.Console.info('Starting filesync...');

    // Sync the actual files.
    copyfiles(
      this.patterns,
      {
        verbose: false,
        up: 1,
      },
      () => {
        super.resolve();
      }
    );
  }

  /**
   * Check if the defined resource path can be resolved form the cwd variable.
   * Also make sure if the actual path already has the working path defined.
   */
  defineResourcePatterns() {
    const { patterns } = this.config;

    if (Array.isArray(patterns)) {
      this.resourcePatterns = patterns;
    }
  }

  /**
   * Make sure that each entry is resolved correctly and that a globbing pattern
   * is also defined for directory defined paths.
   *
   * @param {Array} entries Array with all existing paths to sync.
   */
  resolvePatterns(entries) {
    let resolvedPatterns = [...new Set(entries)];

    // Exclude any empty entries.
    resolvedPatterns = resolvedPatterns.filter((entry) => {
      return entry;
    });

    // Make sure the path is relative to the cwd path.
    resolvedPatterns = resolvedPatterns.map((entry) => {
      return String(entry).startsWith(this.cwd) ? entry : join(this.cwd, entry);
    });

    // Append a glob pattern is the current pattern is an actual directory.
    resolvedPatterns = resolvedPatterns.map((entry) => {
      if (existsSync(entry) && statSync(entry).isDirectory()) {
        return `${entry}/**`;
      }

      return entry;
    });

    return resolvedPatterns;
  }
}

module.exports = FileSync;
