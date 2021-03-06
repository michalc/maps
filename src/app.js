/* eslint-env browser */

(function(angular) {
  'use strict';

  function clamp(val, min, max) {
    return Math.max(Math.min(val, max), min);
  }

  var app = angular.module('mercator', []);

  app.factory('Mercator', function($window) {
    return $window.Mercator;
  });

  (function() {
    function pad(num, size) {
      var s = "000" + num;
      return s.substr(s.length-size);
    }

    function format(degrees, positiveDirection, negativeDirection, padDegrees) {
      var positive = degrees >= 0;
      degrees = Math.abs(degrees);

      var wholeDegrees = Math.floor(degrees);
      var minutes = (degrees - wholeDegrees) * 60;
      var wholeMinutes = Math.floor(minutes);
      var seconds = (minutes - wholeMinutes) * 60;
      var wholeSeconds = Math.floor(seconds);

      return '' +
        pad(wholeDegrees, padDegrees) + '°' +
        pad(wholeMinutes, 2) + '′' +
        pad(wholeSeconds, 2) + '″' +
        (positive ? positiveDirection : negativeDirection);
    }

    app.filter('long', function() {
      return function(long) {
        if (long === null) return null;
        return format(long, 'E', 'W', 3);
      }
    });

    app.filter('lat', function() {
      return function(lat) {
        if (lat === null) return null;
        return format(lat, 'N', 'S', 2);
      }
    });

    app.filter('bearing', function() {
      return function(deg) {
        if (deg === null) return null;
        return format(deg, '', '', 3);
      }
    });
  })();

  app.directive('overlay', function() {
    return {
      restrict: 'A',
      controller: function($scope, $element) {
        var overlay = $element.find('overlay');
        this.show = function() {
          overlay.addClass('overlay-show');
          overlay.addClass('no-select');
          $element.addClass('no-select');
        };

        this.hide = function() {
          $element.removeClass('no-select');
          overlay.removeClass('no-select');
          overlay.removeClass('overlay-show')
        };
      }
    };
  });

  app.directive('reflow', function($window) {
    return {
      link: function(scope) {
        angular.element($window).on('resize scroll', function() {
          scope.$broadcast('reflow');
        });
      }
    };
  });

  app.directive('onDrag', function($document, $parse) {
    return {
      require: '^overlay',
      link: function(scope, element, attrs, overlay) {
        var offsetX = null;
        var offsetY = null;

        var root = element[0].nearestViewportElement;
        var parsedOnDrag = $parse(attrs.onDrag);

        var elementRect, rootRect;
        
        element.on('mouseenter', function() {
          element.addClass('draggable-mouseover');
        });

        element.on('mouseleave', function() {
          element.removeClass('draggable-mouseover');
        });

        element.on('mousedown touchstart', function(e) {
          e.preventDefault();
          overlay.show();

          element.addClass('dragging');

          elementRect = element[0].getBoundingClientRect();
          rootRect = root.getBoundingClientRect();

          // At the moment assuming moving the center of the element
          offsetX = (e.touches ? e.touches[0].clientX : e.clientX) - (elementRect.right + elementRect.left) / 2;
          offsetY = (e.touches ? e.touches[0].clientY : e.clientY) - (elementRect.top + elementRect.bottom) / 2;

          $document.on('mousemove touchmove', onMouseMove);
          $document.on('mouseup touchend', onMouseUp);
        });

        scope.$on('$destroy', onMouseUp);

        function onMouseMove(e) {
          e.preventDefault();
          var x = clamp((e.touches ? e.touches[0].clientX : e.clientX)  - rootRect.left - offsetX, 0, rootRect.width);
          var y = clamp((e.touches ? e.touches[0].clientY : e.clientY) - rootRect.top - offsetY, 0, rootRect.height);
          parsedOnDrag(scope, {$x: x, $y: y});
        }

        function onMouseUp(e) {
          e.preventDefault();
          overlay.hide();

          element.removeClass('dragging');

          offsetX = null;
          offsetY = null;

          $document.off('mousemove touchmove', onMouseMove);
          $document.off('mouseup touchend', onMouseUp);
        }
      }
    };
  });

  app.directive('chart', function(Mercator) {
    return {
      restrict:'E',
      scope: true,
      template: function(tElement, tAttrs) {
        // Maybe have an entirely separate svg layer for map?
        return '' + 
          '<div>' +
            '<svg class="chart-map" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
              'width="' + tAttrs.width + '" height="' + tAttrs.height + '"' +
            '>' +
              '<image x="0" y="0" width="' + tAttrs.width + '" height="' + tAttrs.height  + '" xlink:href="{{ :: chart.src }}"/>' +
            '</svg>' +
            '<svg class="chart-widgets" xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
              'width="' + tAttrs.width + '" height="' + tAttrs.height + '"' +
            '>' +
              '<defs>' +
                '<marker id="marker-arrow" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">' +
                  '<line x1="1" y1="1" x2="6" y2="6" style="stroke:red" stroke-dasharray="100%"/>' +
                  '<line x1="6" y1="6" x2="1" y2="11" style="stroke:red" stroke-dasharray="100%"/>' +
                '</marker>' +
                '<marker id="markerSquare" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto">' +
                  '<rect x="1" y="1" width="5" height="5" style="stroke: none; fill:#000000;"/>' +
                '</marker>' +
              '</defs>' +
              '<circle ng-attr-cx="{{ toChart(circleCoords1).x }}" ng-attr-cy="{{ toChart(circleCoords1).y }}" r="25" on-drag="onDrag(circleCoords1, $x, $y)"/>' +
              '<circle ng-attr-cx="{{ toChart(circleCoords2).x }}" ng-attr-cy="{{ toChart(circleCoords2).y }}" r="25" on-drag="onDrag(circleCoords2, $x, $y)"/>' +
              '<path class="great-circle" stroke-dasharray="2 2" ng-attr-d="{{ path1 }}" style="marker-start:url(#marker-arrow); marker-end:url(#marker-arrow)"/>' +
              '<path class="great-circle" stroke-dasharray="2 2" ng-attr-d="{{ path2 }}" style="marker-start:url(#marker-arrow); marker-end:url(#marker-arrow)"/>' +
            '</svg>' +
          '</div>';
      },
      link: function(scope, element, attrs) {
        scope.chart = scope.$eval(attrs.chart);
        scope.circleCoords1 = scope.$eval(attrs.circleCoords1);
        scope.circleCoords2 = scope.$eval(attrs.circleCoords2);

        if (scope.chart.projection != 'mercator') {
          throw new Error('Projection must be Mercator')
        }

        var numPoints = 200;
        scope.$watchGroup([
          'circleCoords1.long',
          'circleCoords1.lat',
          'circleCoords2.long',
          'circleCoords2.lat'
        ], function() {
          var path = Mercator.greatCirclePath(
            scope.circleCoords1.long,
            scope.circleCoords1.lat,
            scope.circleCoords2.long,
            scope.circleCoords2.lat,
            numPoints
          );
          var path1 = [];
          var path2 = [];
          var onPath1 = 1;
          path.forEach(function(point, i) {
            if (i === 0) {
              path1.push(point);
            } else if (!onPath1) {
              path2.push(point);
            } else {
              var prevPoint = path[i - 1];
              if (Math.abs(prevPoint.long - point.long) > 180) {
                onPath1 = false;
                // Could also push extra points to each path to go past the edge
                path2.push(point);
              } else {
                path1.push(point);
              }
            }
          });

          scope.path1 = '';
          path1.forEach(function(earthCoords,i) {
            var chartCoords = scope.toChart(earthCoords);
            scope.path1 += (i == 0 ? 'M' : 'L') + chartCoords.x + ',' + chartCoords.y;
          });

          scope.path2 = '';
          path2.forEach(function(earthCoords,i) {
            var chartCoords = scope.toChart(earthCoords);
            scope.path2 += (i == 0 ? 'M' : 'L') + chartCoords.x + ',' + chartCoords.y;
          });
        });

        element.css({
          width: attrs.width + 'px',
          height: attrs.height + 'px'
        });

        scope.toChart = function(coords) {
          return Mercator.toChart(scope.chart.bounds, coords.long, coords.lat);
        };

        scope.onDrag = function(circleCoords, $x, $y) {
          var newCoords = Mercator.toEarth(scope.chart.bounds, $x, $y);
          scope.$apply(function() {
            circleCoords.lat = newCoords.lat;
            circleCoords.long = newCoords.long;
          });
        };
      }
    }
  });

  app.controller('MercatorController', function($scope, Mercator) {
    $scope.chart = {
      src: 'data/world.svg',
      projection: 'mercator',
      bounds: {
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
      }
    };

    $scope.circleCoords1 = {
      lat: 37.7,
      long: -122.4
    };
    $scope.circleCoords2 = {
      lat: 51.5,
      long: -0.1
    };
    $scope.bearing = function() {
      return Mercator.bearing($scope.chart.bounds, $scope.circleCoords1.long, $scope.circleCoords1.lat, $scope.circleCoords2.long, $scope.circleCoords2.lat);
    };
  });

})(self.angular);
