// TO MAKE THE MAP APPEAR YOU MUST
// ADD YOUR ACCESS TOKEN FROM
// "pk.eyJ1Ijoia2Fpc2VyMjIyIiwiYSI6ImNsdTl2ZWNkZTBjYWkycXBpa3BzbXI0OXgifQ.oXZkscLAOekqYwMNcN5Qqw"
// https://account.mapbox.com
var pos;
// USER location
const successCallback = (position) => {
  pos = [position.coords.latitude, position.coords.longitude];
  console.log(pos);
};

const errorCallback = (error) => {
  console.log(error);
};

navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

const options = {
  enableHighAccuracy: true,
  timeout: 10000,
};
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  options
);

// MAPBOX GL
mapboxgl.accessToken =
  "pk.eyJ1Ijoia2Fpc2VyMjIyIiwiYSI6ImNsdTl2ZWNkZTBjYWkycXBpa3BzbXI0OXgifQ.oXZkscLAOekqYwMNcN5Qqw";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v12",
  center: pos, // starting position
  zoom: 16,
  pitch: 65,
  bearing: -15.6,
  antialias: true,
});
// set the bounds of the map
// const bounds = [
//   [-123.069003, 45.395273],
//   [-122.303707, 45.612333],
// ];
// map.setMaxBounds(bounds);

// an arbitrary start will always be the same
// only the end or destination will change
// current location

// create a function to make a directions request
async function getRoute(end) {
  console.log(end[0], end[1]);
  console.log(
    `https://api.mapbox.com/directions/v5/mapbox/cycling/${pos[0]},${pos[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
  );
  // make a directions request using cycling profile
  // an arbitrary start will always be the same
  // only the end or destination will change
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/cycling/${pos[0]},${pos[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
    { method: "GET" }
  );

  const json = await query.json();
  console.log(json);
  const data = json.routes[0];
  const route = data.geometry.coordinates;
  const geojson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: route,
    },
  };
  // if the route already exists on the map, we'll reset it using setData
  if (map.getSource("route")) {
    map.getSource("route").setData(geojson);
  }
  // otherwise, we'll make a new request
  else {
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: geojson,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3887be",
        "line-width": 5,
        "line-opacity": 0.75,
      },
    });
  }
  // add turn instructions here at the end
}

map.on("load", () => {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(pos);

  // Add starting point to the map
  map.addLayer({
    id: "point",
    type: "circle",
    source: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: pos,
            },
          },
        ],
      },
    },
    paint: {
      "circle-radius": 10,
      "circle-color": "#3887be",
    },
  });
  // this is where the code from the next step will go
});

map.on("click", (event) => {
  const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
  console.log(coords);
  const end = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: coords,
        },
      },
    ],
  };
  if (map.getLayer("end")) {
    map.getSource("end").setData(end);
  } else {
    map.addLayer({
      id: "end",
      type: "circle",
      source: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: coords,
              },
            },
          ],
        },
      },
      paint: {
        "circle-radius": 20,
        "circle-color": "rgba(255, 20, 20, 0.11)",
      },
    });
  }
  getRoute(coords);
});

var markers = [
  { coordinates: [-122.6475777084925, 45.52381448221945], title: "Store 1" },
  { coordinates: [-122.62938344455733, 45.5073370014058], title: "Store 2" },
  { coordinates: [-122.69992912830605, 45.53511740809495], title: "Store 3" },
];

markers.forEach(function (marker) {
  var el = document.createElement("div");
  el.className = "marker";

  new mapboxgl.Marker(el)
    .setLngLat(marker.coordinates)
    .setPopup(
      new mapboxgl.Popup().setHTML(`<h3 class="w-24">` + marker.title + "</h3>")
    )
    .addTo(map);
});
// 3D style
map.on("style.load", () => {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === "symbol" && layer.layout["text-field"]
  ).id;

  // The 'building' layer in the Mapbox Streets
  // vector tileset contains building height data
  // from OpenStreetMap.
  map.addLayer(
    {
      id: "add-3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#aaa",

        // Use an 'interpolate' expression to
        // add a smooth transition effect to
        // the buildings as the user zooms in.
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.6,
      },
    },
    labelLayerId
  );
});
