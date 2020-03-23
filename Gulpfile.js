/* jshint node:true*/

'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var gulp_plugins = require('gulp-load-plugins')();
var uglify = require('gulp-uglify-es').default;
var cleanCSS = require('gulp-clean-css');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('build', ['bundle', 'css']);

gulp.task('default', ['build']);

gulp.task('bundle', function() {
  var b = browserify({
    entries: './app.js',
    debug: true,
  });

  return b.bundle()
    .pipe(source('./app.js'))
    .pipe(buffer())
    .pipe(uglify({
      toplevel: true
    }))
    .pipe(gulp_plugins.rename('bundle.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('css', function() {
  var HIGHLIGHT_JS_THEME = 'monokai';
  return gulp.src([
      'node_modules/highlight.js/styles/' + HIGHLIGHT_JS_THEME + '.css',
      'app.css',
      'milligram.min.css'
    ])
    .pipe(gulp_plugins.concatCss("bundle.css"))
    .pipe(cleanCSS({
      level: {
        1: {
          specialComments: 0
        }
      }
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('test', ['watch'], function() {
  gulp.src('./')
    .pipe(gulp_plugins.webserver({
      fallback: 'index.html',
      livereload: true,
      open: true
    }));
});

gulp.task('watch', ['build'], function() {
  gulp.watch('./app.js', ['bundle']);
  gulp.watch('./app.css', ['css']);
});
