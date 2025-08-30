import React, { useEffect, useState } from 'react';
import axios from '../utils/api';

function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/tours')
      .then(res => {
        setTours(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tours</h2>
      {loading ? (
        <p>Loading tours...</p>
      ) : (
        <table className="w-full border border-gray-300 rounded">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tours.map(tour => (
              <tr key={tour.id} className="text-center">
                <td className="p-2 border">{tour.id}</td>
                <td className="p-2 border">{tour.title}</td>
                <td className="p-2 border">{tour.price}₺</td>
                <td className="p-2 border space-x-2">
                  <button className="bg-green-500 text-white px-2 py-1 rounded">Edit</button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Tours;
