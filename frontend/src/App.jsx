import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import BookingPage from './pages/BookingPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import DriverPage from './pages/DriverPage.jsx';
import MapBooking from './pages/MapBooking.jsx';

export default function App() {
  return (
    <div className="min-h-screen p-6">
      <nav className="mb-6">
        <Link to="/">Home</Link> | <Link to="/admin">Admin</Link> |{' '}
        <Link to="/driver">Driver</Link> | <Link to="/map">Map</Link>
      </nav>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/map" element={<MapBooking />} />
      </Routes>
    </div>
  );
}
