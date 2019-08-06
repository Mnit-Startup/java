/* eslint-disable dot-notation */
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const {argv} = require('yargs');
const _ = require('lodash');
const fs = require('fs');
const findUp = require('find-up');

const tasks = require('./tasks');

// load options from args
const ARG_TEST_BUILD = argv['includeSpec'] !== undefined;
const ARG_FORCE_BUILD_ON_WATCH = argv['forceBuildOnWatch'] !== undefined;

// static config
const BUILD_DIR_SRC = 'src';
const BUILD_DIR_DEST = 'dist';
const BUILD_DIR_CONFIG = 'config';

// globs for ignoring files on serve
const SERVE_IGNORE_GLOBS = [];

// scripts that would be invoked at each serve cycle
const SERVE_SCRIPTS = [
  'node {dir}/bin/www',
];

// tasks for each serve cycle
const SERVE_TASKS = [];

// task for build cycle
const BUILD_TASKS = [
  'copy_files',
  'compile',
];

// globs for copying files
const COPY_GLOBS = [
  `${BUILD_DIR_SRC}/**/*.json`,
  `${BUILD_DIR_SRC}/**/*.ejs`,
];

// globs for compilation
const COMPILE_GLOBS = [
  // add js files for compilation
  `${BUILD_DIR_SRC}/**/*.js`,
];

if (!ARG_TEST_BUILD) {
  // exclude the .spec.js files
  COMPILE_GLOBS.push(`!${BUILD_DIR_SRC}/**/*.spec.js`);
}

// add build only if forced
if (ARG_FORCE_BUILD_ON_WATCH) {
  SERVE_TASKS.push('build');
}

// define and register gulp tasks
// NOTE: stream is returned in every task to signal async completion

gulp.task('compile', () => gulp.src(COMPILE_GLOBS)
  .pipe(babel({
    presets: ['env'],
    plugins: ['transform-runtime'],
  }))
  .pipe(gulp.dest(BUILD_DIR_DEST)));

// linting via gulp
// pipe #1 - pass it to eslint plugin (no explicit options, let eslintrc handle this)
// pipe #2 - format the results in default format
// pipe #3 - fail only after processing all the files
// noinspection JSCheckFunctionSignatures
gulp.task('lint', () => gulp.src([
  // all js files in root
  '*.js',
  // all js files in src
  `${BUILD_DIR_SRC}/**/*.js`])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError()));

// simply copies files
gulp.task('copy_files', () => gulp.src(COPY_GLOBS)
  .pipe(gulp.dest(BUILD_DIR_DEST)));

gulp.task('build', BUILD_TASKS);

gulp.task('serve', SERVE_TASKS, () => {
  const runner = 'npm run serve-runner';
  const dir = ARG_FORCE_BUILD_ON_WATCH ? BUILD_DIR_DEST : BUILD_DIR_SRC;
  const exec = SERVE_SCRIPTS.map(script => `"${script.replace(/{dir}/g, dir)}"`)
    .join(' ');
  // run nodemon
  nodemon({
    exec: `${runner} -- ${exec}`,
    watch: [BUILD_DIR_SRC, BUILD_DIR_CONFIG],
    tasks: SERVE_TASKS,
    ignore: SERVE_IGNORE_GLOBS,
  });
});

/**
 * @private
 * @function - handler for loading config
 * @param {string | [string]} config
 */
function loadConfig(config) {
  // find path
  const configPath = findUp.sync(config);
  // Fixed-TRUED-95: read only when config file was found
  return configPath ? JSON.parse(fs.readFileSync(configPath, {
    encoding: 'utf-8',
  })) : {};
}

// register tasks defined in the tasks dir
_.forEach(tasks, (task, name) => {
  if (typeof task === 'function') {
    // task with no additional params was provided
    // register directly
    gulp.task(name, _.bind(task, null, argv));
  } else {
    // task with additional param was provided
    // obtain/parse params and register it
    const {
      handler,
      config,
    } = task;
    // register
    gulp.task(name, _.bind(handler, null, config ? _.merge(loadConfig(config), argv) : argv));
  }
});
