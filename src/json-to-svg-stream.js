/* eslint-env node */

(function(module) {
  module.exports = JsonToSvgStream;

  var stream = require('stream');
  var util = require('util');
  var geojsonStream = require('geojson-stream');

  var mercator = require('./mercator');

  function JsonToSvgStream(options, bounds) {
    options = options || {};
    options.writableObjectMode = true;
    options.readableObjectMode = false;
    stream.Transform.call(this, options);

    this.bounds = bounds;

    this.push('<?xml version="1.0" encoding="utf-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">');
    this.push('' +
      '<style type="text/css">' +
        '.land { ' +
          'fill: #f7f7f7;' +
          'fill-opacity: 1;' +
          'stroke: none' +
        '}' +
        '.lake { ' +
          'fill: #068dc5;' +
          'fill-opacity: 1;' +
          'stroke: none' +
        '}' +
        '.border { ' +
          'fill: none;' +
          'stroke: #cccccc;' +
          'stroke-opacity: 1;' +
          'stroke-width: 1;' +
        '}' +
      '</style>'
    );
  }
  util.inherits(JsonToSvgStream, stream.Transform);

  JsonToSvgStream.prototype._transform = function(chunk, encoding, callback) {
    var coords = [];
    var self = this;
    
    if (chunk.geometry.type === 'Polygon') {
      chunk.geometry.coordinates[0].forEach(function(longLat, i) {
        var chartCoords = mercator.toChart(self.bounds, longLat[0], longLat[1]);
        coords.push(chartCoords);
      });

      var path = '<path class="' + chunk.klass + '" d="';
      coords.forEach(function(coord, i) {
        path += (i == 0 ? 'M' : 'L') + coord.x + ',' + coord.y;
      });
      path += 'z"/>';
      this.push(path);
    } else if (chunk.geometry.type === 'LineString') {
      chunk.geometry.coordinates.forEach(function(longLat, i) {
        var chartCoords = mercator.toChart(self.bounds, longLat[0], longLat[1]);
        coords.push(chartCoords);
      });

      var path = '<path class="' + chunk.klass + '" d="';
      coords.forEach(function(coord, i) {
        path += (i == 0 ? 'M' : 'L') + coord.x + ',' + coord.y;
      });
      path += '"/>';
      this.push(path);
    } else {
      this.emit('error');
    }

    callback();
  }

  JsonToSvgStream.prototype._flush = function() {
    this.push('</svg>');
  } 

})(module);
