import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

function ReferralProgram() {
  const [myReferral, setMyReferral] = useState(null);
  const [allReferrals, setAllReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [API.get('/referrals/my')];

      if (isAdmin) {
        promises.push(API.get('/referrals'));
        promises.push(API.get('/referrals/stats'));
      }

      const results = await Promise.all(promises);
      setMyReferral(results[0].data.data);

      if (isAdmin) {
        setAllReferrals(results[1].data.data.referrals);
        setStats(results[2].data.data);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load referral data');
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Referral code copied to clipboard!');
  };

  if (loading) return <Loading message="Loading referral data..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Referral Program</h1>

      {/* My Referral Card */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
        <div className="flex items-center justify-between bg-white bg-opacity-20 p-4 rounded-lg">
          <div>
            <div className="text-4xl font-bold tracking-wider">{myReferral?.referralCode}</div>
            <div className="text-sm opacity-90 mt-2">
              Reward: {myReferral?.rewardValue}
              {myReferral?.rewardType === 'percentage' ? '%' : ' credits'}
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(myReferral?.referralCode)}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Copy Code
          </button>
        </div>
      </div>

      {/* My Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Total Referrals</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {myReferral?.totalReferrals || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Successful Referrals</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {myReferral?.successfulReferrals || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Total Rewards Earned</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {myReferral?.totalRewards || 0}
          </div>
        </div>
      </div>

      {/* My Referred Users */}
      {myReferral?.referredUsers && myReferral.referredUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Your Referrals</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myReferral.referredUsers.map((ref, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ref.user?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(ref.registeredAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        ref.firstBookingCompleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {ref.firstBookingCompleted ? 'Completed Booking' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Section */}
      {isAdmin && stats && (
        <>
          <div className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Program Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-gray-600 text-sm">Total Referrers</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.overview.totalReferrers || 0}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-gray-600 text-sm">Total Referred Users</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.overview.totalReferredUsers || 0}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-gray-600 text-sm">Successful Conversions</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {stats.overview.totalSuccessful || 0}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-gray-600 text-sm">Total Rewards Given</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.overview.totalRewardsGiven || 0}
                </div>
              </div>
            </div>
          </div>

          {stats.topReferrers && stats.topReferrers.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Top Referrers</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Referrals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Successful
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rewards
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topReferrers.map((referrer, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referrer.referrer?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{referrer.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{referrer.totalReferrals}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referrer.successfulReferrals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{referrer.totalRewards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReferralProgram;
