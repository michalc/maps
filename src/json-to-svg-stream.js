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
          'stroke: #cccccc;' +
          'stroke-opacity: 1;' +
          'stroke-width: 0.5;' +
        '}' +
      '</style>'
    );
  }
  util.inherits(JsonToSvgStream, stream.Transform);

  JsonToSvgStream.prototype._transform = function(chunk, encoding, callback) {
    
    if (chunk.geometry.type !== 'Polygon') {
      // Not sure if this is the best way to report error
      this.emit('error', 'Unsupported type ' + chunk.geometry.type);
      return;
    }

    var self = this;
    var coords = [];
    chunk.geometry.coordinates[0].forEach(function(longLat, i) {
      var chartCoords = mercator.toChart(self.bounds, longLat[0], longLat[1]);

      // Quick and dirty way to keep the size down
      //var prevCoords = i == 0 ? null : coords[i - 1];
      //if (!prevCoords || Math.abs(prevCoords.x - chartCoords.x) > 20 || Math.abs(prevCoords.y - chartCoords.y) > 20) {
        coords.push(chartCoords);
      //}
    });

    var path = '<path class="land" d="';
    coords.forEach(function(coord, i) {
      path += (i == 0 ? 'M' : 'L') + coord.x + ',' + coord.y;
    });
    path += 'z"/>'

    this.push(path);
    callback();
  }

  JsonToSvgStream.prototype._flush = function() {
    this.push('</svg>');
  } 

})(module);
