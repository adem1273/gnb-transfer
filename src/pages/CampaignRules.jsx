import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import { ConfirmModal, LoadingButton } from '../components/ui';
import { useToast } from '../components/ui/ToastProvider';
import { handleError } from '../utils/errorHandler';

function CampaignRules() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    conditionType: 'city',
    target: '',
    discountRate: '',
    startDate: '',
    endDate: '',
    active: true,
  });
  
  // Confirmation modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);
  const [applying, setApplying] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await API.get('/admin/campaigns');
      setCampaigns(response.data.data);
      setLoading(false);
      setError('');
    } catch (err) {
      const { userMessage } = handleError(err, 'fetching campaigns');
      setError(userMessage);
      setLoading(false);
      toast.error(userMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await API.patch(`/admin/campaigns/${editingId}`, formData);
        toast.success('Campaign updated successfully');
      } else {
        await API.post('/admin/campaigns', formData);
        toast.success('Campaign created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchCampaigns();
    } catch (err) {
      const { userMessage } = handleError(err, 'saving campaign');
      setError(userMessage);
      toast.error(userMessage);
    }
  };

  const handleEdit = (campaign) => {
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      conditionType: campaign.conditionType,
      target: campaign.target,
      discountRate: campaign.discountRate,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      active: campaign.active,
    });
    setEditingId(campaign._id);
    setShowForm(true);
  };

  const handleDeleteClick = (campaign) => {
    setCampaignToDelete(campaign);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;

    setDeletingCampaignId(campaignToDelete._id);
    try {
      await API.delete(`/admin/campaigns/${campaignToDelete._id}`);
      toast.success(`Campaign "${campaignToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setCampaignToDelete(null);
      fetchCampaigns();
    } catch (err) {
      const { userMessage } = handleError(err, 'deleting campaign');
      toast.error(userMessage);
    } finally {
      setDeletingCampaignId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCampaignToDelete(null);
  };

  const handleToggleActive = async (campaign) => {
    try {
      await API.patch(`/admin/campaigns/${campaign._id}`, {
        active: !campaign.active,
      });
      toast.success(`Campaign ${campaign.active ? 'deactivated' : 'activated'} successfully`);
      fetchCampaigns();
    } catch (err) {
      const { userMessage } = handleError(err, 'updating campaign status');
      setError(userMessage);
      toast.error(userMessage);
    }
  };

  const handleApplyCampaignsClick = () => {
    setApplyModalOpen(true);
  };

  const handleApplyCampaignsConfirm = async () => {
    setApplying(true);
    try {
      await API.post('/admin/campaigns/apply');
      toast.success('Campaign rules applied successfully!');
      setApplyModalOpen(false);
    } catch (err) {
      const { userMessage } = handleError(err, 'applying campaigns');
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setApplying(false);
    }
  };

  const handleApplyCampaignsCancel = () => {
    setApplyModalOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      conditionType: 'city',
      target: '',
      discountRate: '',
      startDate: '',
      endDate: '',
      active: true,
    });
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-center text-gray-500">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Helmet>
        <title>Campaign Rules | GNB Transfer Admin</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Campaign Rules</h2>
        <div className="space-x-2">
          <LoadingButton
            type="button"
            onClick={handleApplyCampaignsClick}
            loading={applying}
            variant="success"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Apply Campaigns Now
          </LoadingButton>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Campaign
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Campaign' : 'Create Campaign'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condition Type *</label>
                <select
                  value={formData.conditionType}
                  onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="city">City</option>
                  <option value="tourType">Tour Type</option>
                  <option value="dayOfWeek">Day of Week</option>
                  <option value="date">Date</option>
                  <option value="bookingCount">Booking Count</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target *</label>
                <input
                  type="text"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Istanbul, Adventure, Monday"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Rate (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                loading={false}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'}
              </LoadingButton>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Target</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Discount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Period</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No campaigns found. Create one to get started!
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{campaign.name}</td>
                  <td className="px-4 py-3 capitalize">{campaign.conditionType}</td>
                  <td className="px-4 py-3">{campaign.target}</td>
                  <td className="px-4 py-3">{campaign.discountRate}%</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(campaign)}
                      className={`px-3 py-1 rounded text-sm ${
                        campaign.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(campaign)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <LoadingButton
                        type="button"
                        onClick={() => handleDeleteClick(campaign)}
                        loading={deletingCampaignId === campaign._id}
                        variant="link"
                        className="text-red-600 hover:text-red-800 text-sm p-0"
                      >
                        Delete
                      </LoadingButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Campaign"
        message={`Are you sure you want to delete campaign "${campaignToDelete?.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Apply Campaigns Confirmation Modal */}
      <ConfirmModal
        open={applyModalOpen}
        title="Apply Campaign Rules"
        message="Are you sure you want to apply all active campaign rules now? This will affect pricing for matching bookings."
        confirmButtonText="Apply"
        cancelButtonText="Cancel"
        onConfirm={handleApplyCampaignsConfirm}
        onCancel={handleApplyCampaignsCancel}
      />
    </div>
  );
}

export default CampaignRules;
