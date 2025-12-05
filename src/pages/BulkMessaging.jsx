import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';

function BulkMessaging() {
  const [bookings, setBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState({ status: '', date: '' });

  // Message form state
  const [messageType, setMessageType] = useState('email');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');

  // WhatsApp results
  const [whatsappLinks, setWhatsappLinks] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchTemplates();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);

      const response = await API.get(`/bookings?${params.toString()}&limit=100`);
      setBookings(response.data.data.bookings || []);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await API.get('/admin/messaging/templates');
      setTemplates(response.data.data.templates || []);
    } catch (err) {
      console.error('Failed to fetch templates');
    }
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map((b) => b._id));
    }
  };

  const handleSelectBooking = (bookingId) => {
    if (selectedBookings.includes(bookingId)) {
      setSelectedBookings(selectedBookings.filter((id) => id !== bookingId));
    } else {
      setSelectedBookings([...selectedBookings, bookingId]);
    }
  };

  const handleTemplateChange = async (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomMessage(template.content);
    }
  };

  const handlePreview = async () => {
    try {
      if (selectedBookings.length === 0) {
        setError('Please select at least one booking');
        return;
      }

      const response = await API.post('/admin/messaging/preview', {
        templateId: selectedTemplate,
        customSubject,
        customContent: customMessage,
        bookingId: selectedBookings[0],
      });

      setPreviewMessage(response.data.data.content);
    } catch (err) {
      setError('Failed to generate preview');
    }
  };

  const handleSendEmail = async () => {
    if (selectedBookings.length === 0) {
      setError('Please select at least one booking');
      return;
    }

    if (!customSubject || !customMessage) {
      setError('Subject and message are required');
      return;
    }

    try {
      setSending(true);
      const response = await API.post('/admin/messaging/send-email', {
        bookingIds: selectedBookings,
        templateId: selectedTemplate,
        customSubject,
        customContent: customMessage,
      });

      const result = response.data.data;
      setSuccess(`Emails sent: ${result.sent}, Failed: ${result.failed}`);
      setSelectedBookings([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateWhatsApp = async () => {
    if (selectedBookings.length === 0) {
      setError('Please select at least one booking');
      return;
    }

    if (!customMessage) {
      setError('Message is required');
      return;
    }

    try {
      setSending(true);
      const response = await API.post('/admin/messaging/generate-whatsapp', {
        bookingIds: selectedBookings,
        message: customMessage,
      });

      setWhatsappLinks(response.data.data.results || []);
      setSuccess(`Generated ${response.data.data.results?.length || 0} WhatsApp links`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate links');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading message="Loading bookings..." />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📨 Bulk WhatsApp & Email Sender</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Selection */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Select Bookings ({selectedBookings.length} selected)</h2>
            <div className="flex gap-2">
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"
              >
                {selectedBookings.length === bookings.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-96 border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length === bookings.length && bookings.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className={`cursor-pointer ${selectedBookings.includes(booking._id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelectBooking(booking._id)}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking._id)}
                        onChange={() => handleSelectBooking(booking._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-sm">{booking.name}</div>
                      <div className="text-xs text-gray-500">{booking.email}</div>
                    </td>
                    <td className="px-4 py-2 text-sm">{booking.phone || '-'}</td>
                    <td className="px-4 py-2 text-sm">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message Composer */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Compose Message</h2>

          {/* Message Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMessageType('email')}
              className={`flex-1 py-2 rounded text-sm font-medium ${
                messageType === 'email' ? 'bg-purple-600 text-white' : 'bg-gray-100'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => setMessageType('whatsapp')}
              className={`flex-1 py-2 rounded text-sm font-medium ${
                messageType === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-gray-100'
              }`}
            >
              📱 WhatsApp
            </button>
          </div>

          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Custom Message</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>

          {messageType === 'email' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Email subject"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full border rounded px-3 py-2 h-32"
              placeholder="Use {name}, {date}, {pickup}, {bookingId} as placeholders"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {'{name}'}, {'{date}'}, {'{time}'}, {'{pickup}'}, {'{bookingId}'}, {'{tour}'}, {'{amount}'}
            </p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handlePreview}
              className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Preview
            </button>
            {messageType === 'email' ? (
              <button
                onClick={handleSendEmail}
                disabled={sending || selectedBookings.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : `Send ${selectedBookings.length} Emails`}
              </button>
            ) : (
              <button
                onClick={handleGenerateWhatsApp}
                disabled={sending || selectedBookings.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? 'Generating...' : `Generate Links`}
              </button>
            )}
          </div>

          {/* Preview */}
          {previewMessage && (
            <div className="p-3 bg-gray-50 rounded border">
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{previewMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Links */}
      {whatsappLinks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📱 WhatsApp Links ({whatsappLinks.length})</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {whatsappLinks.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{link.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{link.phone}</span>
                </div>
                {link.whatsappUrl ? (
                  <a
                    href={link.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Open WhatsApp
                  </a>
                ) : (
                  <span className="text-red-500 text-sm">{link.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkMessaging;
