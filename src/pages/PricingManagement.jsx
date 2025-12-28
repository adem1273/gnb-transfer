import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';

function PricingManagement() {
  const [activeTab, setActiveTab] = useState('routes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Base pricing state
  const [pricings, setPricings] = useState([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [pricingForm, setPricingForm] = useState({
    origin: '',
    destination: '',
    originType: 'airport',
    destinationType: 'district',
    prices: { sedan: '', minivan: '', vip: '' },
    distanceKm: '',
    estimatedDuration: '',
    active: true,
  });

  // Extra services state
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    code: '',
    description: '',
    category: 'convenience',
    price: '',
    priceType: 'fixed',
    maxQuantity: 10,
    active: true,
  });

  // Settings state
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (activeTab === 'routes') {
      fetchPricings();
    } else if (activeTab === 'services') {
      fetchServices();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchPricings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/base-pricing');
      setPricings(response.data.data.pricings || []);
    } catch (err) {
      setError('Failed to fetch pricing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/extra-services');
      setServices(response.data.data.services || []);
    } catch (err) {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/settings');
      setSettings(response.data.data);
    } catch (err) {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        ...pricingForm,
        prices: {
          sedan: parseFloat(pricingForm.prices.sedan) || 0,
          minivan: parseFloat(pricingForm.prices.minivan) || 0,
          vip: parseFloat(pricingForm.prices.vip) || 0,
        },
        distanceKm: parseFloat(pricingForm.distanceKm) || undefined,
        estimatedDuration: parseInt(pricingForm.estimatedDuration) || undefined,
      };

      if (editingPricing) {
        await API.patch(`/admin/base-pricing/${editingPricing._id}`, payload);
        setSuccess('Pricing updated successfully');
      } else {
        await API.post('/admin/base-pricing', payload);
        setSuccess('Pricing created successfully');
      }

      setShowPricingForm(false);
      setEditingPricing(null);
      resetPricingForm();
      fetchPricings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save pricing');
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        ...serviceForm,
        price: parseFloat(serviceForm.price) || 0,
        maxQuantity: parseInt(serviceForm.maxQuantity) || 10,
      };

      if (editingService) {
        await API.patch(`/admin/extra-services/${editingService._id}`, payload);
        setSuccess('Service updated successfully');
      } else {
        await API.post('/admin/extra-services', payload);
        setSuccess('Service created successfully');
      }

      setShowServiceForm(false);
      setEditingService(null);
      resetServiceForm();
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save service');
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await API.patch('/admin/settings', settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    }
  };

  const deletePricing = async (id) => {
    if (!confirm('Are you sure you want to delete this pricing?')) return;
    try {
      await API.delete(`/admin/base-pricing/${id}`);
      fetchPricings();
      setSuccess('Pricing deleted');
    } catch (err) {
      setError('Failed to delete pricing');
    }
  };

  const deleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await API.delete(`/admin/extra-services/${id}`);
      fetchServices();
      setSuccess('Service deleted');
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  const resetPricingForm = () => {
    setPricingForm({
      origin: '',
      destination: '',
      originType: 'airport',
      destinationType: 'district',
      prices: { sedan: '', minivan: '', vip: '' },
      distanceKm: '',
      estimatedDuration: '',
      active: true,
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      code: '',
      description: '',
      category: 'convenience',
      price: '',
      priceType: 'fixed',
      maxQuantity: 10,
      active: true,
    });
  };

  const editPricing = (pricing) => {
    setEditingPricing(pricing);
    setPricingForm({
      origin: pricing.origin,
      destination: pricing.destination,
      originType: pricing.originType,
      destinationType: pricing.destinationType,
      prices: {
        sedan: pricing.prices.sedan.toString(),
        minivan: pricing.prices.minivan.toString(),
        vip: pricing.prices.vip.toString(),
      },
      distanceKm: pricing.distanceKm?.toString() || '',
      estimatedDuration: pricing.estimatedDuration?.toString() || '',
      active: pricing.active,
    });
    setShowPricingForm(true);
  };

  const editService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      code: service.code,
      description: service.description || '',
      category: service.category,
      price: service.price.toString(),
      priceType: service.priceType,
      maxQuantity: service.maxQuantity,
      active: service.active,
    });
    setShowServiceForm(true);
  };

  if (loading && !showPricingForm && !showServiceForm) {
    return <Loading message="Loading..." />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">💰 Dynamic Pricing & Services</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['routes', 'services', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'routes' && '🛣️ Route Pricing'}
            {tab === 'services' && '🛎️ Extra Services'}
            {tab === 'settings' && '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* Route Pricing Tab */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Base Price Table</h2>
            <button
              onClick={() => {
                setShowPricingForm(!showPricingForm);
                setEditingPricing(null);
                resetPricingForm();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {showPricingForm ? 'Cancel' : '+ Add Route'}
            </button>
          </div>

          {showPricingForm && (
            <form onSubmit={handlePricingSubmit} className="bg-gray-50 p-4 rounded mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Origin</label>
                  <input
                    type="text"
                    value={pricingForm.origin}
                    onChange={(e) => setPricingForm({ ...pricingForm, origin: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                    placeholder="e.g., IST Airport"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Origin Type</label>
                  <select
                    value={pricingForm.originType}
                    onChange={(e) => setPricingForm({ ...pricingForm, originType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="airport">Airport</option>
                    <option value="district">District</option>
                    <option value="hotel">Hotel</option>
                    <option value="landmark">Landmark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Destination</label>
                  <input
                    type="text"
                    value={pricingForm.destination}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, destination: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                    placeholder="e.g., Taksim"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Destination Type</label>
                  <select
                    value={pricingForm.destinationType}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, destinationType: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="airport">Airport</option>
                    <option value="district">District</option>
                    <option value="hotel">Hotel</option>
                    <option value="landmark">Landmark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sedan Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.prices.sedan}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        prices: { ...pricingForm.prices, sedan: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minivan Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.prices.minivan}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        prices: { ...pricingForm.prices, minivan: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">VIP Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.prices.vip}
                    onChange={(e) =>
                      setPricingForm({
                        ...pricingForm,
                        prices: { ...pricingForm.prices, vip: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.distanceKm}
                    onChange={(e) => setPricingForm({ ...pricingForm, distanceKm: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={pricingForm.estimatedDuration}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, estimatedDuration: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pricingForm.active}
                    onChange={(e) => setPricingForm({ ...pricingForm, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingPricing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Pricing Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Route
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sedan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Minivan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    VIP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Distance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricings.map((pricing) => (
                  <tr key={pricing._id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {pricing.origin} → {pricing.destination}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pricing.originType} → {pricing.destinationType}
                      </div>
                    </td>
                    <td className="px-4 py-3">${pricing.prices.sedan}</td>
                    <td className="px-4 py-3">${pricing.prices.minivan}</td>
                    <td className="px-4 py-3">${pricing.prices.vip}</td>
                    <td className="px-4 py-3">
                      {pricing.distanceKm ? `${pricing.distanceKm} km` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${pricing.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {pricing.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => editPricing(pricing)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePricing(pricing._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {pricings.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No pricing routes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extra Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Extra Services</h2>
            <button
              onClick={() => {
                setShowServiceForm(!showServiceForm);
                setEditingService(null);
                resetServiceForm();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              {showServiceForm ? 'Cancel' : '+ Add Service'}
            </button>
          </div>

          {showServiceForm && (
            <form onSubmit={handleServiceSubmit} className="bg-gray-50 p-4 rounded mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Service Name</label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                    placeholder="e.g., Child Seat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    value={serviceForm.code}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, code: e.target.value.toUpperCase() })
                    }
                    className="w-full border rounded px-3 py-2"
                    required
                    placeholder="e.g., CHILD_SEAT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="safety">Safety</option>
                    <option value="comfort">Comfort</option>
                    <option value="luxury">Luxury</option>
                    <option value="convenience">Convenience</option>
                    <option value="accessibility">Accessibility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price Type</label>
                  <select
                    value={serviceForm.priceType}
                    onChange={(e) => setServiceForm({ ...serviceForm, priceType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="per_person">Per Person</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_km">Per KM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Quantity</label>
                  <input
                    type="number"
                    value={serviceForm.maxQuantity}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, maxQuantity: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    min="1"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, description: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={serviceForm.active}
                    onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service._id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${service.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {service.description || 'No description'}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-lg font-bold text-purple-600">${service.price}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{service.category}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => editService(service)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteService(service._id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">No services found</div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing Settings</h2>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            {/* Pricing Options */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">💵 Pricing Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Fare ($)</label>
                  <input
                    type="number"
                    value={settings.pricing?.minimumFare || 20}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, minimumFare: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.pricing?.taxRate || 18}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, taxRate: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.pricing?.nightSurchargeEnabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: { ...settings.pricing, nightSurchargeEnabled: e.target.checked },
                      })
                    }
                    className="mr-2"
                  />
                  <label className="text-sm">Night Surcharge</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Night Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.pricing?.nightSurchargeMultiplier || 1.25}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        pricing: {
                          ...settings.pricing,
                          nightSurchargeMultiplier: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Currency Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">💱 Currency Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Default Currency</label>
                  <select
                    value={settings.currency?.default || 'USD'}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        currency: { ...settings.currency, default: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <h4 className="font-medium mt-4 mb-2">Exchange Rates (to USD)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {settings.currency?.exchangeRates?.map((rate, index) => (
                  <div key={rate.currency}>
                    <label className="block text-sm font-medium mb-1">{rate.currency}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={rate.rate}
                      onChange={(e) => {
                        const newRates = [...settings.currency.exchangeRates];
                        newRates[index].rate = parseFloat(e.target.value);
                        setSettings({
                          ...settings,
                          currency: { ...settings.currency, exchangeRates: newRates },
                        });
                      }}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Multipliers */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">📅 Seasonal Multipliers</h3>
              <div className="space-y-2">
                {settings.seasonalMultipliers?.map((multiplier, index) => (
                  <div
                    key={multiplier._id || index}
                    className="flex items-center gap-4 bg-gray-50 p-2 rounded"
                  >
                    <span className="font-medium">{multiplier.name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(multiplier.startDate).toLocaleDateString()} -{' '}
                      {new Date(multiplier.endDate).toLocaleDateString()}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      ×{multiplier.multiplier}
                    </span>
                    <span
                      className={`text-xs ${multiplier.active ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {multiplier.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {(!settings.seasonalMultipliers || settings.seasonalMultipliers.length === 0) && (
                  <p className="text-gray-500 text-sm">No seasonal multipliers configured</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Save Settings
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PricingManagement;
