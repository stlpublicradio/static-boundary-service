# static-boundary-service

Inspired by Chicago Tribune's [boundaryservice](https://github.com/newsapps/boundaryservice).

Theirs requires django, postgresql, postgis, which frankly are largely over my head. Incidentally those things probably also allow boundaryservice to be more efficient and load more and bigger shapefiles than this repo can.

But this one works for our needs. Load up a bunch of topojson layers, type in an address, and see which polygons your address is in. Think: Neighborhoods, school districts, wards, precincts, counties, census-designated places, etc. So far in production we have 12 layers totaling 9.1 MB, and it runs reasonably fast.

Uses [mapbox gl](https://www.mapbox.com/mapbox-gl-js/api/) for generating and displaying the maps, [turf.js](http://turfjs.org/) for figuring out which polygons apply to a point.

[Live demo](https://stlpublicradio.github.io/static-boundary-service/) (_note: shapefiles loaded in the demo only cover city of St. Louis_)

## Instructions

Get a mapbox [access token](https://www.mapbox.com/help/define-access-token/), and add it to the appropriate spot in `boundaries.js`

Add .topojson files to the shapefiles folder.

Add layer objects to the layers variable in boundaries.js. These should have three key-value pairs: `fileName`, `layerName` and `displayName`.

[Census.gov](https://www.census.gov/geo/maps-data/data/tiger-line.html) is a good source of shapefiles, [Mapshaper.org](http://mapshaper.org/) can convert them to topojson.
