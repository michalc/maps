var gulp = require('gulp');
var changed = require('gulp-changed');
var merge = require('merge-stream');

gulp.task('default', function() {
  var build = 'build';

  var src = 'src/*';
  var dest = build;
  var srcFiles = gulp.src(src)
    .pipe(changed(dest))
    .pipe(gulp.dest(dest));


  var bowerSrcDir = 'bower_components';
  var bowerSrc = bowerSrcDir + '/**/*';
  var bowerDest = build + '/bower_components';
  var files = [
    bowerSrcDir + '/lodash/lodash.js',
    bowerSrcDir + '/angular/angular.js',
    bowerSrcDir + '/normalize-css/normalize.css'
  ];

  var bowerFiles = gulp.src(files, {base: bowerSrcDir})
    .pipe(changed(bowerDest))
    .pipe(gulp.dest(bowerDest));

  return merge(srcFiles, bowerFiles);
});