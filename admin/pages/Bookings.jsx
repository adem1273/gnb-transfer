import React, { useEffect, useState } from 'react';
import axios from '../utils/api';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/bookings')
      .then(res => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bookings</h2>
      {loading ? (
        <p>Loading bookings...</p>
      ) : (
        <table className="w-full border border-gray-300 rounded">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">User</th>
              <th className="p-2 border">Tour</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id} className="text-center">
                <td className="p-2 border">{booking.id}</td>
                <td className="p-2 border">{booking.userName}</td>
                <td className="p-2 border">{booking.tourTitle}</td>
                <td className="p-2 border">{booking.date}</td>
                <td className="p-2 border">{booking.status}</td>
                <td className="p-2 border space-x-2">
                  <button className="bg-green-500 text-white px-2 py-1 rounded">Edit</button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Bookings;
