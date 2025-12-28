import { Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Loading from '../components/Loading';

// Lazy load super admin components
const SystemSettingsPanel = lazy(() => import('../components/superadmin/SystemSettingsPanel'));
const KillSwitchPanel = lazy(() => import('../components/superadmin/KillSwitchPanel'));
const FeatureFlagsPanel = lazy(() => import('../components/superadmin/FeatureFlagsPanel'));
const AuditLogViewer = lazy(() => import('../components/superadmin/AuditLogViewer'));

/**
 * SuperAdmin Page
 *
 * Main dashboard for super admin operations
 * Includes system settings, kill switch, feature flags, and audit logs
 *
 * @component
 * @access Super Admin only
 */
function SuperAdmin() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return <Loading />;
  }

  // Redirect if user is not admin or superadmin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System-wide controls and monitoring for administrators
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - System Settings & Kill Switch */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Settings Panel */}
            <Suspense fallback={<Loading />}>
              <SystemSettingsPanel />
            </Suspense>

            {/* Kill Switch Panel */}
            <Suspense fallback={<Loading />}>
              <KillSwitchPanel />
            </Suspense>

            {/* Audit Log Viewer */}
            <Suspense fallback={<Loading />}>
              <AuditLogViewer />
            </Suspense>
          </div>

          {/* Right Column - Feature Flags */}
          <div className="lg:col-span-1">
            <Suspense fallback={<Loading />}>
              <FeatureFlagsPanel />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdmin;
