import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./App.css";
import { neighborhoods, createGeoJSONFeature } from "./neighborhoods";

mapboxgl.accessToken = 'pk.eyJ1IjoiYWt1em1hMTgiLCJhIjoiY204aHZhMXF3MDZjNjJycG1pdHJrZ2gyZyJ9.Py9M4AmZEGdxMJUda8h0jg'; // Replace with your token

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selected, setSelected] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  useEffect(() => {
    // Default center in case geolocation fails
    const defaultCenter = [-74.5, 40];

    // Initialize map with default center
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10",
      center: defaultCenter,
      zoom: 13,
    });

    // Add all neighborhoods when map loads
    map.current.on('load', () => {
      // Loop through all neighborhoods
      Object.keys(neighborhoods).forEach((neighborhoodKey) => {
        const neighborhood = neighborhoods[neighborhoodKey];
        const neighborhoodBoundary = createGeoJSONFeature(neighborhood.coordinates);
        
        // Create unique IDs for each neighborhood
        const sourceId = `${neighborhoodKey}-source`;
        const boundaryLayerId = `${neighborhoodKey}-boundary`;
        const fillLayerId = `${neighborhoodKey}-fill`;
        const labelSourceId = `${neighborhoodKey}-label-source`;
        const labelLayerId = `${neighborhoodKey}-label-layer`;

        // Add source if it doesn't exist
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, {
            type: 'geojson',
            data: neighborhoodBoundary
          });
        }

        // Add boundary layer if it doesn't exist
        if (!map.current.getLayer(boundaryLayerId)) {
          map.current.addLayer({
            id: boundaryLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#151515',
              'line-width': 2,
              'line-opacity': 1
            }
          });
        }

        // Determine fill color and opacity based on label
        let fillColor = '#4CA09C';
        let fillOpacity = 0.22;
        let percent = 0;
        if (neighborhood.label && neighborhood.label.endsWith('%')) {
          percent = parseInt(neighborhood.label.replace('%', ''), 10);
        }
        if (percent === 0) {
          fillColor = '#777777';
          fillOpacity = 0.10;
        } else if (percent >= 1 && percent <= 30) {
          fillColor = '#4CA09C';
          fillOpacity = 0.06;
        } else if (percent > 30 && percent <= 70) {
          fillColor = '#4CA09C';
          fillOpacity = 0.14;
        } else if (percent > 70 && percent < 100) {
          fillColor = '#4CA09C';
          fillOpacity = 0.22;
        } else if (percent === 100) {
          fillColor = '#4C61A0';
          fillOpacity = 0.22;
        }

        // Add fill layer if it doesn't exist
        if (!map.current.getLayer(fillLayerId)) {
          map.current.addLayer({
            id: fillLayerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': fillOpacity,
              'fill-outline-color': 'transparent'
            }
          });
        }

        // Add label source if it doesn't exist
        if (!map.current.getSource(labelSourceId)) {
          map.current.addSource(labelSourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: neighborhood.centroid
                  },
                  properties: {
                    label: neighborhood.label
                  }
                }
              ]
            }
          });
        }

        // Add label layer if it doesn't exist
        if (!map.current.getLayer(labelLayerId)) {
          map.current.addLayer({
            id: labelLayerId,
            type: 'symbol',
            source: labelSourceId,
            layout: {
              'text-field': ['get', 'label'],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                10, 14,   // At zoom 10, size 14
                14, 24,   // At zoom 14, size 24
                18, 40    // At zoom 18, size 40
              ],
              'text-anchor': 'center'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1
            }
          });
        }

        // Add click event for this neighborhood
        map.current.on('click', fillLayerId, () => {
          setSelectedNeighborhood(selectedNeighborhood === neighborhoodKey ? null : neighborhoodKey);
          setSelected(selectedNeighborhood !== neighborhoodKey);
        });

        // Add hover events for this neighborhood
        map.current.on('mouseenter', fillLayerId, () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current.on('mouseleave', fillLayerId, () => {
          map.current.getCanvas().style.cursor = '';
        });
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
    if (!map.current || !selectedNeighborhood) return;
    
    const boundaryLayerId = `${selectedNeighborhood}-boundary`;
    
    if (map.current.getLayer && map.current.getLayer(boundaryLayerId)) {
      map.current.setPaintProperty(
        boundaryLayerId,
        'line-color',
        selected ? '#4CA09C' : '#151515'
      );
      map.current.setPaintProperty(
        boundaryLayerId,
        'line-width',
        selected ? 8 : 2
      );
      map.current.setPaintProperty(
        boundaryLayerId,
        'line-opacity',
        selected ? 1 : 1
      );
    }
  }, [selected, selectedNeighborhood]);

  return (
    <div ref={mapContainer} className="map-container" />
  );
}

export default App;
