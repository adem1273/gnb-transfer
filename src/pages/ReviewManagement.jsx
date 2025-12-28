import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';

function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState({ status: '', rating: '' });
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.rating) params.append('rating', filter.rating);

      const response = await API.get(`/reviews?${params.toString()}`);
      setReviews(response.data.data.reviews || []);
    } catch (err) {
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/reviews/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const updateReviewStatus = async (reviewId, status, showOnHomepage = false) => {
    try {
      await API.patch(`/reviews/${reviewId}/status`, {
        status,
        showOnHomepage,
        adminResponse: adminResponse || undefined,
      });
      setSuccess(`Review ${status}`);
      setSelectedReview(null);
      setAdminResponse('');
      fetchReviews();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update review');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await API.delete(`/reviews/${reviewId}`);
      setSuccess('Review deleted');
      fetchReviews();
      fetchStats();
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) return <Loading message="Loading reviews..." />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">⭐ Review & Rating Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Average Rating</div>
            <div className="text-3xl font-bold mt-2">{stats.averageRating?.toFixed(1)} ⭐</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Reviews</div>
            <div className="text-3xl font-bold mt-2">{stats.totalReviews}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">5-Star Reviews</div>
            <div className="text-3xl font-bold mt-2">{stats.ratingDistribution?.[5] || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Pending Review</div>
            <div className="text-3xl font-bold mt-2">
              {reviews.filter((r) => r.status === 'pending').length}
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats?.ratingDistribution && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-12 text-sm font-medium">{rating} ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-yellow-500 h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-gray-600">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="flagged">Flagged</option>
        </select>
        <select
          value={filter.rating}
          onChange={(e) => setFilter({ ...filter, rating: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <button
          onClick={() => setFilter({ status: '', rating: '' })}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear Filters
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl text-yellow-500">{renderStars(review.rating)}</span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      review.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : review.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : review.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {review.status}
                  </span>
                  {review.showOnHomepage && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                      ⭐ Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  By {review.user?.name || 'Anonymous'} •{' '}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
                {review.title && <h3 className="font-semibold mt-2">{review.title}</h3>}
                <p className="text-gray-700 mt-2">{review.comment || 'No comment provided'}</p>

                {/* Detailed Ratings */}
                {(review.driverRating || review.vehicleRating || review.punctualityRating) && (
                  <div className="mt-3 flex gap-4 text-sm text-gray-600">
                    {review.driverRating && <span>Driver: {review.driverRating}⭐</span>}
                    {review.vehicleRating && <span>Vehicle: {review.vehicleRating}⭐</span>}
                    {review.punctualityRating && (
                      <span>Punctuality: {review.punctualityRating}⭐</span>
                    )}
                  </div>
                )}

                {/* Admin Response */}
                {review.adminResponse && (
                  <div className="mt-3 bg-gray-50 p-3 rounded border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-gray-700">Admin Response:</p>
                    <p className="text-sm text-gray-600">{review.adminResponse}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                {review.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateReviewStatus(review._id, 'approved')}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateReviewStatus(review._id, 'rejected')}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </>
                )}
                {review.status === 'approved' && (
                  <button
                    onClick={() =>
                      updateReviewStatus(review._id, 'approved', !review.showOnHomepage)
                    }
                    className={`px-3 py-1 text-sm rounded ${
                      review.showOnHomepage
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-purple-500 text-white'
                    }`}
                  >
                    {review.showOnHomepage ? 'Unfeature' : 'Feature'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedReview(review)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Respond
                </button>
                <button
                  onClick={() => deleteReview(review._id)}
                  className="px-3 py-1 text-red-600 text-sm hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 text-gray-500">No reviews found</div>
        )}
      </div>

      {/* Response Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Respond to Review</h3>
            <p className="text-sm text-gray-600 mb-4">
              Review by {selectedReview.user?.name}: "{selectedReview.comment?.slice(0, 100)}..."
            </p>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Write your response..."
              className="w-full border rounded px-3 py-2 h-32"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setAdminResponse('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateReviewStatus(
                    selectedReview._id,
                    selectedReview.status,
                    selectedReview.showOnHomepage
                  )
                }
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewManagement;
