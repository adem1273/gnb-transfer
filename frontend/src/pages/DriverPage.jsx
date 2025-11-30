import React, { useEffect } from 'react';
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');
export default function DriverPage(){
  useEffect(()=>{ const id = prompt('Driver id (type a unique id)'); if(!id) return; const send = ()=>{ navigator.geolocation.getCurrentPosition(pos=>{ socket.emit('driver:location', { driverId: id, lat: pos.coords.latitude, lng: pos.coords.longitude }); }); };
    const timer = setInterval(send, 5000);
    return ()=> clearInterval(timer);
  },[]);
  return (<div><h2>Driver panel</h2><p>Location updates sent every 5s</p></div>);
}
