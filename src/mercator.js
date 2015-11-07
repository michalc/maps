(function(Mercator) {
  Mercator.toChart = toChart;
  Mercator.toEarth = toEarth;
  Mercator.bearing = bearing;

  function toRadians(deg) {
    return deg * Math.PI / 180;
  }

  function toDegrees(rad) {
    return rad * 180 / Math.PI;
  }

  function yToTheta(W, y) {
    return 2 * Math.atan(Math.exp(y * 2 * Math.PI / W)) - Math.PI / 2;
  }

  function thetaToY(W, theta) {
    return W / (2 * Math.PI) * Math.log(Math.tan(Math.PI / 4 + theta / 2));
  }

  function xToLambda(W, lambda_0, x) {
    return lambda_0 + x * 2 * Math.PI / W; 
  }

  function lambdaToX(W, lambda_0, lambda) {
    return W / (2 * Math.PI) * (lambda - lambda_0);
  }

  function getW(chartBounds) {
    return chartBounds.screen.right - chartBounds.screen.left;
  }

  function getLambda_0(chartBounds) {
    return toRadians(chartBounds.earth.left);
  }

  function getY_top(chartBounds) {
    var W = getW(chartBounds);
    var theta_top = toRadians(chartBounds.earth.top);
    return thetaToY(W, theta_top);
  }

  function toChart(chartBounds, long, lat) {
    var W = getW(chartBounds);

    var theta = toRadians(lat);
    var y = thetaToY(W, theta);
    var y_top = getY_top(chartBounds);
    var chartY = y_top - y;

    var lambda = toRadians(long);
    var lambda_0 = getLambda_0(chartBounds);
    var x = lambdaToX(W, lambda_0, lambda);
    var chartX = x;

    return {
      x: chartX,
      y: chartY
    };
  }

  function toEarth(chartBounds, chartX, chartY) {
    var W = getW(chartBounds);

    var lambda_0 = getLambda_0(chartBounds, chartX);
    var x = chartX;
    var lambda = xToLambda(W, lambda_0, x);
    var long = toDegrees(lambda);

    var y_top = getY_top(chartBounds);
    var y = y_top - chartY;
    var theta = yToTheta(W, y);
    var lat = toDegrees(theta); 

    return {
      long: long,
      lat: lat
    };
  }

  function bearing(chartBounds, fromLong, fromLat, toLong, toLat) {
    var fromChartCoords = toChart(chartBounds, fromLong, fromLat);
    var toChartCoords = toChart(chartBounds, toLong, toLat);
    var dx = toChartCoords.x - fromChartCoords.x;
    var dy = fromChartCoords.y - toChartCoords.y; // y increasing doing down, not up
    if (dy === 0) {
      if (dx === 0) return 0;
      if (dx > 0) return 90;
      return 270;
    }
    var theta = Math.atan(dx/dy);
    return toDegrees(theta) + (dy < 0 ? 180 : 0) + (dx < 0 && dy > 0 ? 360 : 0);
  }

})(typeof exports === 'undefined' ? this.Mercator = {} : exports);
