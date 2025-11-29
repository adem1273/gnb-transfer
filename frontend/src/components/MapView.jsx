import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView({ center = [41.0082, 28.9784], zoom = 12 }) {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = L.map('map').setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);
  }, []);

  return <div id="map" style={{ height: '500px' }}></div>;
}
