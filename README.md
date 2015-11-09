# maps [![Build Status](https://travis-ci.org/michalc/maps.svg?branch=master)](https://travis-ci.org/michalc/maps)

This is the source repository for [http://maps.charemza.name/](http://maps.charemza.name/).

The content of the `data` directory is derived from data provided by the [NOAA National Geophysical Data Center](http://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html), and is released under the LGPL. The remainder of this project is released under the MIT License.

## Build

To build the site into the `build` directory:

```
npm install --production
grunt
```

## Deploy

This project is deployed onto Amazon S3 using Travis. See the [.travis.yml](.travis.yml) file for details.

## Develop

To download the source data and re-generate the SVG chart:

```
npm install
grunt download-charts
grunt generate-charts
```

The derived SVG chart is deliberatly committed to this repository to avoid the source data being re-downloaded and processed on every build.
