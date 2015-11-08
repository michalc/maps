/* eslint-env node */

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var changed = require('gulp-changed');
var merge = require('merge2');

// Requires dev dependencies to be installed
gulp.task('download-charts', function () {
  var download = require('gulp-download');
  var unzip = require('gulp-unzip');
  var url = 'http://www.ngdc.noaa.gov/mgg/shorelines/data/gshhg/latest/gshhg-shp-2.3.4.zip';
  return download(url)
    .pipe(unzip())
    .pipe(gulp.dest('data_src/'));
});

// Requires dev dependencies to be installed,
// and download-charts task to be run
gulp.task('generate-charts', function () {
  var source = require('vinyl-source-stream');

  var mapJsonStream = require('./src/map-json-stream');
  var jsonToSvgStream = require('./src/json-to-svg-stream');

  var l1Land = 'data_src/GSHHS_shp/c/GSHHS_c_L1.shp';

  // Lakes
  var l2Land = 'data_src/GSHHS_shp/c/GSHHS_c_L2.shp';
  var l1Border =  'data_src/WDBII_shp/c/WDBII_border_c_L1.shp';

  var outputDir = 'data';
  var outputFile = 'world.svg';

  var bounds = {
    earth: {
      top: 83.6,
      bottom: -83.6,
      left: -180,
      right: 180
    },
    screen: {
      top: 0,
      bottom: 665, 
      left: 0,
      right: 1010
    }
  };

  var l1LandmapStream = new mapJsonStream({}, l1Land, 'land');
  var l2LandmapStream = new mapJsonStream({}, l2Land, 'lake');
  var l1BordermapStream = new mapJsonStream({}, l1Border, 'border');
  var svgStream = new jsonToSvgStream({}, bounds);
  return merge(l1LandmapStream, l2LandmapStream, l1BordermapStream)
    .pipe(svgStream)
    .pipe(source(outputFile))
    .pipe(gulp.dest(outputDir));
});

gulp.task('lint', function () {
  return gulp.src(['gulpfile.js', 'src/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('default', [], function() {
  var cssnext = require('gulp-cssnext');
  var build = 'build';
  var dest = build;

  var dataSrc = 'data/*.svg';
  var dataDest = build + '/data';
  var data = gulp.src(dataSrc)
    .pipe(changed(dataDest))
    .pipe(gulp.dest(dataDest));

  var jsSrc = [
    'src/mercator.js',
    'src/app.js'
  ];
  var js= gulp.src(jsSrc)
    .pipe(changed(dest))
    .pipe(gulp.dest(dest));

  var htmlSrc = [
    'src/index.html'
  ];
  var html = gulp.src(htmlSrc)
    .pipe(changed(dest))
    .pipe(gulp.dest(dest));

  var cssSrc = [
    'src/style.css'
  ];
  var css = gulp.src(cssSrc)
    .pipe(changed(dest))
    .pipe(cssnext({
      browsers: 'Safari >= 8, iOS >= 8, Chrome >= 46, Firefox >= 42'
    }))
    .pipe(gulp.dest(dest));


  var bowerSrcDir = 'bower_components';
  var bowerDest = build + '/bower_components';
  var files = [
    bowerSrcDir + '/angular/angular.min.js',
    bowerSrcDir + '/normalize-css/normalize.css'
  ];

  var bower = gulp.src(files, {base: bowerSrcDir})
    .pipe(changed(bowerDest))
    .pipe(gulp.dest(bowerDest));

  return merge(data, html, js, css, bower);
});
