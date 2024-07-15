mapboxgl.accessToken = 'pk.eyJ1Ijoia2Fpc2VyMjIyIiwiYSI6ImNsdTl2ZWNkZTBjYWkycXBpa3BzbXI0OXgifQ.oXZkscLAOekqYwMNcN5Qqw';

let pos = [];

// Geolocation success callback
const successCallback = (position) => {
  console.log(position);
  pos = [position.coords.longitude, position.coords.latitude];
  if (!map) {
    initializeMap(); // Initialize map after getting position
  } else {
    map.setCenter(pos); // Update center if map already initialized
  }
};

// Geolocation error callback
const errorCallback = (error) => {
  console.log(error);
};

// Request geolocation
const options = {
  enableHighAccuracy: true,
  timeout: 10000,
};
navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
navigator.geolocation.watchPosition(successCallback, errorCallback, options);

let map; // Declare map variable

// Function to initialize the map
function initializeMap() {
  if (pos.length === 0) return; // Ensure pos is set before initializing map

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: pos, // starting position
    zoom: 18,
    pitch: 65,
    bearing: -15.6,
    antialias: true,
  });

  map.on('load', () => {
    // Add starting point to the map
    map.addLayer({
      id: 'point',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: pos,
              },
            },
          ],
        },
      },
      paint: {
        'circle-radius': 10,
        'circle-color': '#3887be',
      },
    });

    // Function to make a directions request
    async function getRoute(end) {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/cycling/${pos[0]},${pos[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
      );

      const json = await query.json();
      const data = json.routes[0];
      const route = data.geometry.coordinates;
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      };

      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      } else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#f30',
            'line-width': 10,
            'line-opacity': 1,
          },
        });
      }
    }

    // Initial route request
    getRoute(pos);
  });

  // Handle map clicks to set end point and get directions
  map.on('click', (event) => {
    const coords = Object.keys(event.lngLat).map((key) => event.lngLat[key]);
    const end = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: coords,
          },
        },
      ],
    };

    if (map.getLayer('end')) {
      map.getSource('end').setData(end);
    } else {
      map.addLayer({
        id: 'end',
        type: 'circle',
        source: {
          type: 'geojson',
          data: end,
        },
        paint: {
          'circle-radius': 20,
          'circle-color': 'rgba(255, 20, 20, 0.11)',
        },
      });
    }
    getRoute(coords);
  });

  // Add markers to the map
  const markers = [
    { coordinates: [-122.6475777084925, 45.52381448221945], title: 'Store 1' },
    { coordinates: [-122.62938344455733, 45.5073370014058], title: 'Store 2' },
    { coordinates: [-122.69992912830605, 45.53511740809495], title: 'Store 3' },
  ];

  markers.forEach((marker) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker(el)
      .setLngLat(marker.coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<h3 class="w-24">${marker.title}</h3>`))
      .addTo(map);
  });

  // 3D buildings
  map.on('style.load', () => {
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id;

    map.addLayer(
      {
        id: 'add-3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.6,
        },
      },
      labelLayerId
    );
  });
}
