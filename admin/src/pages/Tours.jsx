import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await API.get('/tours');
        setTours(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch tours');
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return;
    try {
      await API.delete(`/tours/${id}`);
      setTours(tours.filter(tour => tour._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete tour');
    }
  };

  if (loading) return <p className="p-4">Loading tours...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header title="Tours" />
        <div className="p-4 max-w-6xl mx-auto">
          <Helmet>
            <title>GNB Transfer Admin | Tours</title>
          </Helmet>
          <h2 className="text-2xl font-bold mb-4">Tours Management</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Title</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Duration</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour._id}>
                  <td className="border p-2">{tour.title}</td>
                  <td className="border p-2">{tour.price}₺</td>
                  <td className="border p-2">{tour.duration} days</td>
                  <td className="border p-2">
                    <button
                      onClick={() => alert('Edit functionality not implemented yet')}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tour._id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
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

export default Tours;
