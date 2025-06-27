import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";

mapboxgl.accessToken = 'pk.eyJ1IjoiYWt1em1hMTgiLCJhIjoiY204aHZhMXF3MDZjNjJycG1pdHJrZ2gyZyJ9.Py9M4AmZEGdxMJUda8h0jg'; // Replace with your token

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    // Default center in case geolocation fails
    const defaultCenter = [-74.5, 40];

    // Park Slope boundary GeoJSON
    const parkSlopeBoundary = {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-73.97806687548409, 40.68488419266882],
          [-73.98389395483494, 40.67614930054148],
          [-73.99288748480325, 40.66539216409436],
          [-73.98935216289065, 40.66311225566585],
          [-73.98657756979759, 40.65963069951647],
          [-73.98311359847479, 40.65740854131997],
          [-73.97959847321171, 40.66130629205787],
          [-73.97423027092445, 40.667796716952864],
          [-73.97131679315545, 40.671264059853],
          [-73.96993980243529, 40.673413233034694],
          [-73.9710764599761, 40.675272513337006],
          [-73.97806687548409, 40.68488419266882]
        ]]
      }
    };

    // Initialize map with default center
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/akuzma18/clynrcx48001u01qn4pkdhso4",
      center: defaultCenter,
      zoom: 13,
    });

    // Add Park Slope boundary layer when map loads
    map.current.on('load', () => {
      // Only add the source if it doesn't already exist
      if (!map.current.getSource('park-slope')) {
        map.current.addSource('park-slope', {
          type: 'geojson',
          data: parkSlopeBoundary
        });
      }

      // Only add the boundary layer if it doesn't already exist
      if (!map.current.getLayer('park-slope-boundary')) {
        map.current.addLayer({
          id: 'park-slope-boundary',
          type: 'line',
          source: 'park-slope',
          paint: {
            'line-color': '#151515',
            'line-opacity': 0.2,
            'line-width': 3
          }
        });
      }

      // Only add the fill layer if it doesn't already exist
      if (!map.current.getLayer('park-slope-fill')) {
        map.current.addLayer({
          id: 'park-slope-fill',
          type: 'fill',
          source: 'park-slope',
          paint: {
            'fill-color': '#4CA09C',
            'fill-opacity': 0.22
          }
        });
      }

      // Calculate centroid (approximate)
      const centroid = [-73.9817, 40.6707]; // Approximate center of your polygon

      // Add a GeoJSON source for the label
      if (!map.current.getSource('park-slope-label')) {
        map.current.addSource('park-slope-label', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: centroid
                },
                properties: {
                  label: '25%'
                }
              }
            ]
          }
        });
      }

      // Add a symbol layer for the label with zoom-dependent text size
      if (!map.current.getLayer('park-slope-label-layer')) {
        map.current.addLayer({
          id: 'park-slope-label-layer',
          type: 'symbol',
          source: 'park-slope-label',
          layout: {
            'text-field': ['get', 'label'],
            'text-size': [
              'interpolate', ['linear'], ['zoom'],
              10, 14,   // At zoom 10, size 18
              14, 32,   // At zoom 14, size 32
              18, 60    // At zoom 18, size 60
            ],
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 2
          }
        });
      }

      // Listen for clicks on the fill layer to toggle selection
      map.current.on('click', 'park-slope-fill', () => {
        setSelected((prev) => !prev);
      });

      // Change cursor to pointer on hover
      map.current.on('mouseenter', 'park-slope-fill', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'park-slope-fill', () => {
        map.current.getCanvas().style.cursor = '';
      });
    });

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCenter = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          map.current.setCenter(userCenter);

          // Optionally, add a marker at the user's location
          new mapboxgl.Marker().setLngLat(userCenter).addTo(map.current);
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  // Update border color and width based on selection
  useEffect(() => {
    if (!map.current) return;
    if (map.current.getLayer && map.current.getLayer('park-slope-boundary')) {
      map.current.setPaintProperty(
        'park-slope-boundary',
        'line-color',
        selected ? '#4CA09C' : '#151515'
      );
      map.current.setPaintProperty(
        'park-slope-boundary',
        'line-width',
        selected ? 8 : 3
      );
      map.current.setPaintProperty(
        'park-slope-boundary',
        'line-opacity',
        selected ? 1 : 0.2
      );
    }
  }, [selected]);

  return (
    <div ref={mapContainer} className="map-container" />
  );
}

export default App;
