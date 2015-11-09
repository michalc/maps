# maps [![Build Status](https://travis-ci.org/michalc/maps.svg?branch=master)](https://travis-ci.org/michalc/maps)

This is the source repository for [http://maps.charemza.name/](http://maps.charemza.name/).

The content of the `data` directory is derived from data provided by the [NOAA National Geophysical Data Center](http://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html), and is released under the LGPL. The remainder of this project is released under the MIT License.

## Building

```
npm install --production
grunt
```

## Developing

To download and re-generate the SVG charts, you can run the following.

```
npm install
grunt download-charts
grunt generate-charts
```
