import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function DriverPage() {
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Authentication required. Please login first.');
      return;
    }

    const driverId = prompt('Driver id (type a unique id)');
    if (!driverId) return;

    // Create socket connection with authentication
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);
      setError(null);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setError(`Connection failed: ${err.message}`);
      setConnected(false);
    });

    socketInstance.on('error', (err) => {
      console.error('Socket error:', err.message);
      setError(err.message);
    });

    setSocket(socketInstance);

    const send = () => {
      if (!socketInstance.connected) return;
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          socketInstance.emit('driver:location', {
            driverId: driverId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Failed to get location');
        }
      );
    };

    const timer = setInterval(send, 5000);

    return () => {
      clearInterval(timer);
      socketInstance.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Driver Panel</h2>
      <p>Status: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
      {connected && <p>Location updates sent every 5 seconds</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
