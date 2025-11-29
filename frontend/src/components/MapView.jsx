import React, { useEffect, useRef, useId } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView({ center = [41.0082, 28.9784], zoom = 12 }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const mapId = useId();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]);

  return <div id={mapId} ref={containerRef} style={{ height: '500px' }}></div>;
}
