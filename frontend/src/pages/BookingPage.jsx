import React, { useState } from 'react';
import axios from 'axios';
export default function BookingPage(){
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async ()=>{
    try{ const r = await axios.post((import.meta.env.VITE_API_URL||'/api') + '/bookings', { pickup, dropoff, date: new Date().toISOString() }); setMsg('Booked: '+ r.data.booking._id); }catch(e){ setMsg('Error'); }
  };
  return (<div><h2>Booking</h2><input placeholder="pickup" value={pickup} onChange={e=>setPickup(e.target.value)} /><input placeholder="dropoff" value={dropoff} onChange={e=>setDropoff(e.target.value)} /><button onClick={submit}>Book</button><p>{msg}</p></div>);
}
