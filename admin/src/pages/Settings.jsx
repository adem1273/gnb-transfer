import React, { useEffect, useState } from 'react';
import axios from 'axios';

// API utility for admin endpoints
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : (process.env.VITE_API_URL || 'http://localhost:5000/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Settings() {
  const [settings, setSettings] = useState({
    siteName: '',
    logo: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    currency: 'USD',
    defaultLanguage: 'en',
    featureFlags: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currencies = ['USD', 'EUR', 'TRY', 'GBP', 'SAR', 'AED'];
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'hi', name: 'Hindi' },
    { code: 'it', name: 'Italian' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
  ];

  const featureFlagLabels = {
    enableBookings: 'Enable Bookings',
    enablePayments: 'Enable Payments',
    enableLoyalty: 'Enable Loyalty Program',
    enableReferrals: 'Enable Referrals',
    enableChatSupport: 'Enable Chat Support',
    enableBlog: 'Enable Blog',
    enableReviews: 'Enable Reviews',
    enableCoupons: 'Enable Coupons',
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/global-settings');
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Convert featureFlags Map to object if needed
        const flags = data.featureFlags instanceof Map 
          ? Object.fromEntries(data.featureFlags)
          : (data.featureFlags || {});

        setSettings({
          siteName: data.siteName || '',
          logo: data.logo || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          address: data.address || '',
          currency: data.currency || 'USD',
          defaultLanguage: data.defaultLanguage || 'en',
          featureFlags: flags,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeatureFlagToggle = (flagName) => {
    setSettings(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [flagName]: !prev.featureFlags[flagName],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/admin/global-settings', settings);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save settings';
      setMessage({ type: 'error', text: errorMsg });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Global Settings</h2>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        {/* Site Information */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Site Information</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="siteName">
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={settings.siteName}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="logo">
              Logo (Media Reference/URL)
            </label>
            <input
              type="text"
              id="logo"
              name="logo"
              value={settings.logo}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Placeholder ID or URL"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Contact Information</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactEmail">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactPhone">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={settings.contactPhone}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={settings.address}
              onChange={handleInputChange}
              rows="3"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>

        {/* Localization */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Localization</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
              Default Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={settings.currency}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="defaultLanguage">
              Default Language
            </label>
            <select
              id="defaultLanguage"
              name="defaultLanguage"
              value={settings.defaultLanguage}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Feature Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(featureFlagLabels).map(flagKey => (
              <div key={flagKey} className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.featureFlags[flagKey] || false}
                      onChange={() => handleFeatureFlagToggle(flagKey)}
                    />
                    <div
                      className={`block w-14 h-8 rounded-full transition ${
                        settings.featureFlags[flagKey]
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    ></div>
                    <div
                      className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                        settings.featureFlags[flagKey] ? 'translate-x-6' : ''
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-gray-700 font-medium">
                    {featureFlagLabels[flagKey]}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
