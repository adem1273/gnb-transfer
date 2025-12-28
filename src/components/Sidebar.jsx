import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;

  return (
    <aside className="fixed left-0 top-0 w-64 h-full bg-gray-800 text-white flex flex-col p-4 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">GNB Admin</h2>
      <nav className="flex flex-col gap-2">
        {canManage && (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase mt-2 mb-1">Main</div>
            <Link to="/admin/dashboard" className="px-2 py-1 hover:bg-gray-700 rounded">
              Dashboard
            </Link>
            <Link to="/admin/users" className="px-2 py-1 hover:bg-gray-700 rounded">
              Users
            </Link>
            <Link to="/admin/bookings" className="px-2 py-1 hover:bg-gray-700 rounded">
              Bookings
            </Link>
            <Link to="/admin/vehicles" className="px-2 py-1 hover:bg-gray-700 rounded">
              Vehicles
            </Link>

            <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
              Content
            </div>
            <Link to="/admin/blog" className="px-2 py-1 hover:bg-gray-700 rounded flex items-center">
              📝 Blog (9 Languages)
            </Link>
            <Link to="/admin/media" className="px-2 py-1 hover:bg-gray-700 rounded flex items-center">
              🖼️ Media Manager
            </Link>

            <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
              New Features
            </div>
            <Link to="/admin/calendar" className="px-2 py-1 hover:bg-gray-700 rounded">
              📅 Calendar View
            </Link>
            <Link to="/admin/insights" className="px-2 py-1 hover:bg-gray-700 rounded">
              📊 AI Insights
            </Link>
            <Link to="/admin/campaigns" className="px-2 py-1 hover:bg-gray-700 rounded">
              🎯 Campaigns
            </Link>

            <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
              Business & Ops
            </div>
            <Link to="/admin/fleet" className="px-2 py-1 hover:bg-gray-700 rounded">
              🚗 Fleet Tracking
            </Link>
            <Link to="/admin/drivers/performance" className="px-2 py-1 hover:bg-gray-700 rounded">
              📈 Driver Performance
            </Link>
            <Link to="/admin/delay-compensation" className="px-2 py-1 hover:bg-gray-700 rounded">
              ⏰ Delay Compensation
            </Link>
            <Link to="/admin/analytics" className="px-2 py-1 hover:bg-gray-700 rounded">
              💰 Revenue Analytics
            </Link>
            <Link to="/admin/corporate" className="px-2 py-1 hover:bg-gray-700 rounded">
              🏢 Corporate Clients
            </Link>

            <Link to="/admin/finance" className="px-2 py-1 hover:bg-gray-700 rounded">
              💳 Finance
            </Link>
            <Link to="/admin/coupons" className="px-2 py-1 hover:bg-gray-700 rounded">
              🎟️ Coupons
            </Link>
            <Link to="/admin/referrals" className="px-2 py-1 hover:bg-gray-700 rounded">
              🔗 Referral Program
            </Link>

            <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
              Ultimate Admin
            </div>
            <Link to="/admin/pricing" className="px-2 py-1 hover:bg-gray-700 rounded">
              💵 Dynamic Pricing
            </Link>
            <Link to="/admin/reviews" className="px-2 py-1 hover:bg-gray-700 rounded">
              ⭐ Reviews & Ratings
            </Link>
            <Link to="/admin/loyalty" className="px-2 py-1 hover:bg-gray-700 rounded">
              🎁 Loyalty Points
            </Link>
            <Link to="/admin/messaging" className="px-2 py-1 hover:bg-gray-700 rounded">
              📨 Bulk Messaging
            </Link>
            <Link to="/admin/blog" className="px-2 py-1 hover:bg-gray-700 rounded">
              📝 Blog & SEO
            </Link>
            <Link to="/admin/tracking" className="px-2 py-1 hover:bg-gray-700 rounded">
              📊 Ad Tracking
            </Link>

            {isAdmin && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
                  Settings
                </div>
                <Link to="/admin/features" className="px-2 py-1 hover:bg-gray-700 rounded">
                  🎛️ Feature Toggles
                </Link>
                <Link to="/admin/modules" className="px-2 py-1 hover:bg-gray-700 rounded">
                  ⚙️ Modules
                </Link>
                <Link to="/admin/notifications" className="px-2 py-1 hover:bg-gray-700 rounded">
                  📧 Notifications
                </Link>
                <Link to="/admin/logs" className="px-2 py-1 hover:bg-gray-700 rounded">
                  📝 Activity Logs
                </Link>
                <Link to="/admin/super" className="px-2 py-1 hover:bg-red-700 bg-red-600 rounded font-semibold">
                  ⚡ Super Admin
                </Link>
              </>
            )}

            <div className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">AI Tools</div>
            <Link to="/admin/ai" className="px-2 py-1 hover:bg-gray-700 rounded">
              🤖 AI Admin
            </Link>
            <Link to="/admin/marketing" className="px-2 py-1 hover:bg-gray-700 rounded">
              📱 AI Marketing
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
