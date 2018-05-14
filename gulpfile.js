"use strict";

// Require environment variabels from .env
// We use these variables to set a custom src/dist path
// for our gulp tasks
const ENV = require('dotenv').config();

// We use Gulp for our build system
// Each gulp task is defined as a seperate task located in ./gulp
const GULP = require('gulp');

// Autoload all Gulp modules that are installed from the package.json
// More information: https://www.npmjs.com/package/gulp-load-plugins
const GULP_PLUGINS = require('gulp-load-plugins')();

// Load Node modules only for the current gulpfile
const NODE_MODULES = {
    chalk: require('chalk'),
    runSequence: require('run-sequence').use(GULP),
};


GULP.task('sync', gulpTask('sync'));
GULP.task('stylesheets', gulpTask('stylesheets'));
GULP.task('watch', gulpTask('watch'));

function gulpTask(file) {
    return require('./gulp/' + file)(GULP, GULP_PLUGINS);
}