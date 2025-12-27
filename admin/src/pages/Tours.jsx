import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';

function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    duration: '',
    discount: 0,
    image: '',
  });

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

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setFormData({
      title: tour.title || '',
      description: tour.description || '',
      price: tour.price || '',
      duration: tour.duration || '',
      discount: tour.discount || 0,
      image: tour.image || '',
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingTour(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      duration: '',
      discount: 0,
      image: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTour) {
        const res = await API.put(`/tours/${editingTour._id}`, formData);
        const updatedTour = res.data.data || res.data;
        setTours(tours.map(t => t._id === editingTour._id ? updatedTour : t));
      } else {
        const res = await API.post('/tours', formData);
        const newTour = res.data.data || res.data;
        setTours([...tours, newTour]);
      }
      setShowForm(false);
      setEditingTour(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save tour');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTour(null);
  };

  const handleImageUploaded = (imageUrl) => {
    setFormData(prev => ({ ...prev, image: imageUrl }));
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Tours Management</h2>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Tour
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h3 className="text-xl font-bold mb-4">
                {editingTour ? 'Edit Tour' : 'Create Tour'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration (days)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Discount (%)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    min="0"
                    max="100"
                  />
                </div>

                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  currentImage={formData.image}
                  label="Tour Image"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editingTour ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Image</th>
                <th className="border p-2">Title</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Duration</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour._id}>
                  <td className="border p-2">
                    {tour.image ? (
                      <img src={tour.image} alt={tour.title} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">No image</div>
                    )}
                  </td>
                  <td className="border p-2">{tour.title}</td>
                  <td className="border p-2">{tour.price}₺</td>
                  <td className="border p-2">{tour.duration} days</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleEdit(tour)}
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
