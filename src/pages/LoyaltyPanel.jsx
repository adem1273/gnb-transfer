import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';

function LoyaltyPanel() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ userId: '', points: '', reason: '' });
  const [bonusForm, setBonusForm] = useState({ userIds: '', points: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, statsRes] = await Promise.all([
        API.get('/loyalty/leaderboard?limit=20'),
        API.get('/loyalty/stats'),
      ]);
      setLeaderboard(leaderboardRes.data.data.leaderboard || []);
      setStats(statsRes.data.data);
    } catch (err) {
      setError('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await API.post('/loyalty/adjust', {
        userId: adjustForm.userId,
        points: parseInt(adjustForm.points),
        reason: adjustForm.reason,
      });
      setSuccess('Points adjusted successfully');
      setShowAdjustModal(false);
      setAdjustForm({ userId: '', points: '', reason: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust points');
    }
  };

  const handleAwardBonus = async (e) => {
    e.preventDefault();
    try {
      const userIds = bonusForm.userIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      await API.post('/loyalty/award-bonus', {
        userIds,
        points: parseInt(bonusForm.points),
        reason: bonusForm.reason,
      });
      setSuccess('Bonus points awarded successfully');
      setShowBonusModal(false);
      setBonusForm({ userIds: '', points: '', reason: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to award bonus');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'platinum':
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver':
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
      default:
        return 'bg-gradient-to-r from-orange-300 to-orange-500 text-white';
    }
  };

  if (loading) return <Loading message="Loading loyalty data..." />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">🎁 Loyalty & Points System</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Adjust Points
          </button>
          <button
            onClick={() => setShowBonusModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Award Bonus
          </button>
        </div>
      </div>

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
      {stats?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Members</div>
            <div className="text-3xl font-bold mt-2">
              {stats.summary.totalMembers?.toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Points Issued</div>
            <div className="text-3xl font-bold mt-2">
              {stats.summary.totalPointsIssued?.toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Available Points</div>
            <div className="text-3xl font-bold mt-2">
              {stats.summary.totalPointsAvailable?.toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Total Rides</div>
            <div className="text-3xl font-bold mt-2">
              {stats.summary.totalRides?.toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-700 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Avg Points/Member</div>
            <div className="text-3xl font-bold mt-2">
              {Math.round(stats.summary.avgPointsPerMember || 0)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        {stats?.tierDistribution && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tier Distribution</h2>
            <div className="space-y-3">
              {stats.tierDistribution.map((tier) => (
                <div key={tier._id} className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded font-medium ${getTierColor(tier._id)}`}>
                    {tier._id?.toUpperCase() || 'BRONZE'}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(tier.count / (stats.summary?.totalMembers || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{tier.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward Stats */}
        {stats?.rewardStats && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Rewards Overview</h2>
            <div className="space-y-3">
              {stats.rewardStats.map((reward) => (
                <div
                  key={reward._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span className="font-medium capitalize">{reward._id?.replace('_', ' ')}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">✓ Earned: {reward.earned}</span>
                    <span className="text-blue-600">📦 Used: {reward.used}</span>
                  </div>
                </div>
              ))}
              {stats.rewardStats.length === 0 && (
                <p className="text-gray-500 text-center py-4">No rewards data yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🏆 Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Lifetime Points
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Available
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Rides
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((member, index) => (
                <tr key={member._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`text-lg ${
                        index === 0
                          ? 'text-yellow-500'
                          : index === 1
                            ? 'text-gray-400'
                            : index === 2
                              ? 'text-orange-500'
                              : ''
                      }`}
                    >
                      {index === 0
                        ? '🥇'
                        : index === 1
                          ? '🥈'
                          : index === 2
                            ? '🥉'
                            : `#${index + 1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{member.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{member.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${getTierColor(member.tier)}`}
                    >
                      {member.tier?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-purple-600">
                    {member.lifetimePoints?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.availablePoints?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">{member.totalRides}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Rules */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📋 Program Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-medium">5th Ride Reward</h3>
            <p className="text-sm text-gray-600">20% discount on your 5th ride</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="font-medium">10th Ride Free</h3>
            <p className="text-sm text-gray-600">Free ride on your 10th booking</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-medium">Points System</h3>
            <p className="text-sm text-gray-600">1 point per $1 spent</p>
          </div>
        </div>
      </div>

      {/* Adjust Points Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Adjust User Points</h3>
            <form onSubmit={handleAdjustPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  type="text"
                  value={adjustForm.userId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, userId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="MongoDB User ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points (+/-)</label>
                <input
                  type="number"
                  value={adjustForm.points}
                  onChange={(e) => setAdjustForm({ ...adjustForm, points: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="e.g., 100 or -50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Reason for adjustment"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Adjust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Award Bonus Points</h3>
            <form onSubmit={handleAwardBonus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User IDs (comma-separated)</label>
                <textarea
                  value={bonusForm.userIds}
                  onChange={(e) => setBonusForm({ ...bonusForm, userIds: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-20"
                  required
                  placeholder="userId1, userId2, userId3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bonus Points</label>
                <input
                  type="number"
                  value={bonusForm.points}
                  onChange={(e) => setBonusForm({ ...bonusForm, points: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="1"
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={bonusForm.reason}
                  onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Holiday bonus"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Award Bonus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoyaltyPanel;
