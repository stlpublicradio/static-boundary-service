// Constants
var COLORS = ["#006c8e", "#f1bb4f", "#f6883e", "#55b7d9", "#e8604d", "#571751", "#449970", "#c72068", "#70a99a", "#a5a585", "#358fb3", "#6b6256", "#31716e", "#8c1b52"]

var onDocumentLoad = function(e) {

    // mapbox access token — update this with your own
    mapboxgl.accessToken = "";

    // set up map
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [-90.280416, 38.635945],
        zoom: 11
    });

    // set up geocoder & add to map
    var geocoder = new mapboxgl.Geocoder({
        "proximity": [-90.280416, 38.635945],
        "zoom": 11,
        "placeholder": "St. Louis Public Radio, 3651 Olive St., Saint Louis MO 63109"
    });

    map.addControl(geocoder);
    map.addControl(new mapboxgl.Navigation());

    // define how to add geojson
    var regions;

    var addGeojsonLayer = function(layers) {
        var key = Object.keys(layers.objects)
        regions = topojson.feature(layers, layers.objects[key]);
        return regions;
    }

    // here are the layers; you can add as many of these as needed, only layers relevant to the selected point will be displayed
    var layers = [{
        "fileName": "../shapefiles/stl_nhoods.topojson",
        "layerName": "stl_nhoods",
        "displayName": "Neighborhood"
    }
    , {
        "fileName": "../shapefiles/stl_ward.topojson",
        "layerName": "stl_ward",
        "displayName": "Ward"
    }
];

    // set up d3 queue to load each layer
    var q = d3.queue();
    var shapes = new Object();

    for (i = 0; i < layers.length; i++) {
        q.defer(d3.json, layers[i].fileName);
    }

    q.awaitAll(function(error, results) {
        for (i = 0; i < results.length; i++) {
            key = layers[i].layerName;
            data = addGeojsonLayer(results[i]);
            shapes[key] = {};
            shapes[key]["data"] = data;
            shapes[key]["displayName"] = layers[i].displayName;
        }
    });

    // appends the relevant layers, places and show/hide links to the right side of the page
    var updateDisplay = function(category, place, key) {

        // create container div for each shape
        var containerDiv = document.createElement("div");
        containerDiv.className = key + " place-container";
        document.getElementById("places").appendChild(containerDiv);

        // create content-holding div for each container
        var newContentDiv = document.createElement("div");
        newContentDiv.className = "place-content"
        containerDiv.appendChild(newContentDiv);

        // create heading for each container
        var newHeading = document.createElement("h3");
        newContentDiv.appendChild(newHeading);
        newHeading.innerHTML = category;
        var newPlace = document.createElement("p");
        newContentDiv.appendChild(newPlace);
        newPlace.innerHTML = place;

        // create color span for each container
        var newColorSpan = document.createElement("span");
        newColorSpan.className = "color";
        var color = map.getPaintProperty(key, 'fill-color');
        newColorSpan.style.background = color;

        newContentDiv.insertBefore(newColorSpan, newHeading);

        // create show/hide layer link
        function addShowHideLink(id) {
            var link = document.createElement('a');
            link.href = '#';
            link.className = 'active';
            link.textContent = "show/hide layer";

            // click event to toggle layer visibility
            link.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();

                var visibility = map.getLayoutProperty(id, 'visibility');

                if (visibility == 'visible') {
                    map.setLayoutProperty(id, 'visibility', 'none');
                    this.className = '';
                } else {
                    this.className = 'active';
                    map.setLayoutProperty(id, 'visibility', 'visible')
                }
            };

            newContentDiv.appendChild(link);
        };

        addShowHideLink(key);
    };

    shapeArray = new Object();

    var addShapeToArray = function(key, shape) {
        shapeArray[key] = shape;
    };

    // load only the shapes that the point is in, using turf.js
    var processMaps = function(point) {
        shapeArray = new Object();
        Object.keys(shapes).forEach(function(key, index) {
            Object.keys(shapes[key].data.features).forEach(function(key2, index) {
                shape = shapes[key].data.features[key2];
                pt = turf.point(point);
                if (turf.inside(pt, shape)) {
                    category = shapes[key].displayName;
                    place = shape.properties.NAMELSAD
                    updateDisplay(category, place, key);
                    addShapeToArray(key, shape);
                }
            })
        })
    }

    // take a point and update the map display with only the layers that have relevant shapes
    var updateMapDisplay = function(point) {
        var placesDiv = document.getElementById("places");
        placesDiv.innerHTML = '';
        processMaps(point);
        var all_maps = [];
        for (i = 0; i < layers.length; i++) {
            all_maps.push(layers[i].layerName);
        }
        Object.keys(shapeArray).forEach(function(key) {
            map.getSource(key).setData(shapeArray[key])
            map.setLayoutProperty(key, 'visibility', 'none')
            index = all_maps.indexOf(key)
            if (index > -1) {
                all_maps.splice(index, 1);
            }
        });
        for (i = 0; i < all_maps.length; i++) {
            var id = all_maps[i];
            map.setLayoutProperty(id, 'visibility', 'none')
        }
    }

    // initial load of map, with one layer per shapefile, plus a layer for the point
    map.on('load', function() {
        for (i = 0; i < layers.length; i++) {
            map.addSource(layers[i].layerName, {
                'type': 'geojson',
                'data': {
                    "type": "FeatureCollection",
                    "features": []
                }
            });

            map.addLayer({
                'id': layers[i].layerName,
                'type': 'fill',
                'source': layers[i].layerName,
                'layout': {},
                'paint': {
                    'fill-color': COLORS[i % 14],
                    'fill-opacity': 0.5
                }
            });

        };

        defaultStart = [-90.233596, 38.639130];
        updateMapDisplay(defaultStart);

        map.addSource('single-point', {
            "type": "geojson",
            "data": turf.point(defaultStart)
        });

        map.addLayer({
            "id": "point",
            "source": "single-point",
            "type": "circle",
            "paint": {
                "circle-radius": 10,
                "circle-color": "#cc203b"
            }
        });


        geocoder.on('result', function(ev) {
            map.getSource('single-point').setData(ev.result.geometry);
            pt1 = ev.result.geometry.coordinates;
            updateMapDisplay(pt1);
        });
    });

};

$(onDocumentLoad);
