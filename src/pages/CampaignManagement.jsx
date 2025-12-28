import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { ConfirmModal, LoadingButton } from '../components/ui';
import { useToast } from '../components/ui/ToastProvider';
import { handleError } from '../utils/errorHandler';

function CampaignManagement() {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Confirmation modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    discountType: 'percentage',
    discountValue: '',
    seasonMultiplier: '1.0',
    startDate: '',
    endDate: '',
    applicableRoutes: [],
    applicableTours: [],
    autoGenerateCoupon: false,
    couponCode: '',
    maxUsage: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    active: true,
    priority: '0',
  });

  const [routeInput, setRouteInput] = useState({ origin: '', destination: '' });

  useEffect(() => {
    fetchCampaigns();
    fetchTours();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await API.get('/campaigns');
      setCampaigns(response.data.campaigns || []);
      setError('');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(t('admin.campaigns.loadError') || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchTours = async () => {
    try {
      const response = await API.get('/tours');
      setTours(response.data || []);
    } catch (err) {
      console.error('Error fetching tours:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Prepare data
      const data = {
        ...formData,
        discountValue: parseFloat(formData.discountValue) || 0,
        seasonMultiplier: parseFloat(formData.seasonMultiplier) || 1.0,
        maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount
          ? parseFloat(formData.maxDiscountAmount)
          : null,
        priority: parseInt(formData.priority) || 0,
      };

      if (editingId) {
        await API.patch(`/campaigns/${editingId}`, data);
        setSuccess(t('admin.campaigns.updateSuccess') || 'Campaign updated successfully');
      } else {
        await API.post('/campaigns', data);
        setSuccess(t('admin.campaigns.createSuccess') || 'Campaign created successfully');
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchCampaigns();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(
        err.response?.data?.error || t('admin.campaigns.saveError') || 'Failed to save campaign'
      );
    }
  };

  const handleEdit = (campaign) => {
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      type: campaign.type,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue.toString(),
      seasonMultiplier: campaign.seasonMultiplier?.toString() || '1.0',
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      applicableRoutes: campaign.applicableRoutes || [],
      applicableTours: campaign.applicableTours?.map((t) => t._id || t) || [],
      autoGenerateCoupon: campaign.autoGenerateCoupon || false,
      couponCode: campaign.couponCode || '',
      maxUsage: campaign.maxUsage?.toString() || '',
      minPurchaseAmount: campaign.minPurchaseAmount?.toString() || '',
      maxDiscountAmount: campaign.maxDiscountAmount?.toString() || '',
      active: campaign.active,
      priority: campaign.priority?.toString() || '0',
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
      await API.delete(`/campaigns/${campaignToDelete._id}`);
      toast.success(
        t('admin.campaigns.deleteSuccess') || `Campaign "${campaignToDelete.name}" deleted successfully`
      );
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
      await API.patch(`/campaigns/${campaign._id}`, {
        active: !campaign.active,
      });
      fetchCampaigns();
    } catch (err) {
      console.error('Error toggling campaign:', err);
      setError(t('admin.campaigns.toggleError') || 'Failed to update campaign');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'general',
      discountType: 'percentage',
      discountValue: '',
      seasonMultiplier: '1.0',
      startDate: '',
      endDate: '',
      applicableRoutes: [],
      applicableTours: [],
      autoGenerateCoupon: false,
      couponCode: '',
      maxUsage: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      active: true,
      priority: '0',
    });
    setRouteInput({ origin: '', destination: '' });
  };

  const handleAddRoute = () => {
    if (routeInput.origin && routeInput.destination) {
      setFormData({
        ...formData,
        applicableRoutes: [...formData.applicableRoutes, { ...routeInput }],
      });
      setRouteInput({ origin: '', destination: '' });
    }
  };

  const handleRemoveRoute = (index) => {
    setFormData({
      ...formData,
      applicableRoutes: formData.applicableRoutes.filter((_, i) => i !== index),
    });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const getCampaignTypeLabel = (type) => {
    const types = {
      discount: t('admin.campaigns.type.discount') || 'Discount',
      seasonal_multiplier: t('admin.campaigns.type.seasonal') || 'Seasonal Multiplier',
      route_specific: t('admin.campaigns.type.routeSpecific') || 'Route Specific',
      general: t('admin.campaigns.type.general') || 'General',
    };
    return types[type] || type;
  };

  if (loading) {
    return <Loading message={t('admin.campaigns.loading') || 'Loading campaigns...'} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{t('admin.campaigns.title') || 'Campaign Management'} | GNB Transfer Admin</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {t('admin.campaigns.title') || 'Campaign Management'}
        </h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {showForm
            ? t('common.cancel') || 'Cancel'
            : t('admin.campaigns.createNew') || '+ New Campaign'}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingId
              ? t('admin.campaigns.edit') || 'Edit Campaign'
              : t('admin.campaigns.create') || 'Create Campaign'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.name') || 'Campaign Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.type') || 'Type'} *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="general">{t('admin.campaigns.type.general') || 'General'}</option>
                  <option value="discount">
                    {t('admin.campaigns.type.discount') || 'Discount'}
                  </option>
                  <option value="route_specific">
                    {t('admin.campaigns.type.routeSpecific') || 'Route Specific'}
                  </option>
                  <option value="seasonal_multiplier">
                    {t('admin.campaigns.type.seasonal') || 'Seasonal Multiplier'}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.campaigns.form.description') || 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            {formData.type !== 'seasonal_multiplier' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.campaigns.form.discountType') || 'Discount Type'}
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">
                      {t('admin.campaigns.discountType.percentage') || 'Percentage (%)'}
                    </option>
                    <option value="fixed">
                      {t('admin.campaigns.discountType.fixed') || 'Fixed Amount'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.campaigns.form.discountValue') || 'Discount Value'} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            )}

            {formData.type === 'seasonal_multiplier' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.seasonMultiplier') || 'Season Multiplier'} (e.g., 1.2 for
                  +20%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={formData.seasonMultiplier}
                  onChange={(e) => setFormData({ ...formData, seasonMultiplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.startDate') || 'Start Date'} *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.endDate') || 'End Date'} *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.minPurchase') || 'Min Purchase Amount'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.maxDiscount') || 'Max Discount Amount'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.maxUsage') || 'Max Usage'}
                </label>
                <input
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.autoGenerateCoupon}
                  onChange={(e) =>
                    setFormData({ ...formData, autoGenerateCoupon: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  {t('admin.campaigns.form.autoGenerateCoupon') || 'Auto-generate coupon code'}
                </label>
              </div>

              {!formData.autoGenerateCoupon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.campaigns.form.couponCode') || 'Coupon Code'}
                  </label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) =>
                      setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SUMMER2024"
                  />
                </div>
              )}
            </div>

            {formData.type === 'route_specific' && (
              <div className="border border-gray-200 rounded-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.campaigns.form.applicableRoutes') || 'Applicable Routes'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={routeInput.origin}
                    onChange={(e) => setRouteInput({ ...routeInput, origin: e.target.value })}
                    placeholder={t('admin.campaigns.form.origin') || 'Origin'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={routeInput.destination}
                    onChange={(e) => setRouteInput({ ...routeInput, destination: e.target.value })}
                    placeholder={t('admin.campaigns.form.destination') || 'Destination'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoute}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    {t('common.add') || 'Add'}
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.applicableRoutes.map((route, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded"
                    >
                      <span>
                        {route.origin} → {route.destination}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoute(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        {t('common.remove') || 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.campaigns.form.applicableTours') || 'Applicable Tours'} (optional)
              </label>
              <select
                multiple
                value={formData.applicableTours}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                  setFormData({ ...formData, applicableTours: selected });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                size="5"
              >
                {tours.map((tour) => (
                  <option key={tour._id} value={tour._id}>
                    {tour.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('admin.campaigns.form.toursHelp') ||
                  'Hold Ctrl/Cmd to select multiple. Leave empty for all tours.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.campaigns.form.priority') || 'Priority'} (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  {t('admin.campaigns.form.active') || 'Active'}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingId ? t('common.update') || 'Update' : t('common.create') || 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.campaigns.table.name') || 'Name'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.campaigns.table.type') || 'Type'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.campaigns.table.discount') || 'Discount/Multiplier'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.campaigns.table.dates') || 'Dates'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.campaigns.table.usage') || 'Usage'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.campaigns.table.status') || 'Status'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  {t('admin.campaigns.noCampaigns') ||
                    'No campaigns found. Create your first campaign!'}
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    {campaign.couponCode && (
                      <div className="text-xs text-gray-500">Code: {campaign.couponCode}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getCampaignTypeLabel(campaign.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.type === 'seasonal_multiplier' ? (
                      `×${campaign.seasonMultiplier}`
                    ) : (
                      <>
                        {campaign.discountType === 'percentage'
                          ? `${campaign.discountValue}%`
                          : `$${campaign.discountValue}`}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(campaign.startDate)}</div>
                    <div>{formatDate(campaign.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.currentUsage || 0}
                    {campaign.maxUsage && ` / ${campaign.maxUsage}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(campaign)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {campaign.active
                        ? t('common.active') || 'Active'
                        : t('common.inactive') || 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleEdit(campaign)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      {t('common.edit') || 'Edit'}
                    </button>
                    <LoadingButton
                      type="button"
                      onClick={() => handleDeleteClick(campaign)}
                      loading={deletingCampaignId === campaign._id}
                      variant="link"
                      className="text-red-600 hover:text-red-900 p-0"
                    >
                      {t('common.delete') || 'Delete'}
                    </LoadingButton>
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
        title={t('admin.campaigns.deleteTitle') || 'Delete Campaign'}
        message={
          t('admin.campaigns.deleteConfirmMessage') ||
          `Are you sure you want to delete campaign "${campaignToDelete?.name}"? This action cannot be undone.`
        }
        confirmButtonText={t('common.delete') || 'Delete'}
        cancelButtonText={t('common.cancel') || 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

export default CampaignManagement;
