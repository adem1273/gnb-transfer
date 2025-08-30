import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function Bookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await API.get('/bookings');
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title="Bookings" />
        <div className="p-4 max-w-6xl mx-auto">
          <Helmet>
            <title>GNB Transfer Admin | Bookings</title>
          </Helmet>
          <h2 className="text-2xl font-bold mb-4">Bookings Management</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Tour</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td className="border p-2">{booking.name}</td>
                  <td className="border p-2">{booking.email}</td>
                  <td className="border p-2">{booking.tour?.title || 'N/A'}</td>
                  <td className="border p-2">{booking.status}</td>
                  <td className="border p-2">
                    <button className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2">
                      Confirm
                    </button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Bookings;
