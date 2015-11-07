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
        
        element.on('mousedown touchstart', function(e) {
          e.preventDefault();
          overlay.show();

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
                  '<line x1="1" y1="1" x2="6" y2="6" style="stroke-width: 1; fill: none" stroke-dasharray="100%"/>' +
                  '<line x1="6" y1="6" x2="1" y2="11" style="stroke-width: 1; fill: none" stroke-dasharray="100%"/>' +
                '</marker>' +
              '</defs>' +
              '<line stroke-dasharray="2 2" ng-attr-x1="{{ toChart(circleCoords1).x }}" ng-attr-y1="{{ toChart(circleCoords1).y }}" ng-attr-x2="{{ toChart(circleCoords2).x }}" ng-attr-y2="{{ toChart(circleCoords2).y }}" style="marker-start:url(#marker-arrow); marker-end:url(#marker-arrow)"/>' +
              '<circle ng-attr-cx="{{ toChart(circleCoords1).x }}" ng-attr-cy="{{ toChart(circleCoords1).y }}" r="25" on-drag="onDrag(circleCoords1, $x, $y)"/>' +
              '<circle ng-attr-cx="{{ toChart(circleCoords2).x }}" ng-attr-cy="{{ toChart(circleCoords2).y }}" r="25" on-drag="onDrag(circleCoords2, $x, $y)"/>' +
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
      //src: 'world.svg',
      src: 'data/GSHHS_c_L1.svg',
      projection: 'mercator',
      bounds: {
        earth: {
          top: 88,
          bottom: -88,
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
      lat: 0,
      long: 0
    };
    $scope.circleCoords2 = {
      lat: 30,
      long: 60
    };
    $scope.bearing = function() {
      return Mercator.bearing($scope.chart.bounds, $scope.circleCoords1.long, $scope.circleCoords1.lat, $scope.circleCoords2.long, $scope.circleCoords2.lat);
    };
  });

})(self.angular);
