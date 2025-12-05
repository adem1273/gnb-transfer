import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import ErrorBoundary from './components/ErrorBoundary';

// Eager load critical components
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import FloatingLanguageButton from './components/FloatingLanguageButton';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Tours = lazy(() => import('./pages/Tours'));
const Booking = lazy(() => import('./pages/Booking'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./components/BlogPost'));
const Contact = lazy(() => import('./pages/Contact'));

// Lazy load payment and admin components (heavy)
const StripePayment = lazy(() => import('./components/StripePayment'));
const AdminDashboard = lazy(() => import('./pages/Dashboard'));
const AdminBookings = lazy(() => import('./pages/Bookings'));
const AdminUsers = lazy(() => import('./pages/Users'));
const AIAdminPanel = lazy(() => import('./components/AIAdminPanel'));
const AIMarketingPanel = lazy(() => import('./components/AIMarketingPanel'));
const VehicleManagement = lazy(() => import('./pages/VehicleManagement'));
const DriverPanel = lazy(() => import('./pages/DriverPanel'));

// Lazy load new admin panel features
const ModuleManagement = lazy(() => import('./pages/ModuleManagement'));
const CampaignRules = lazy(() => import('./pages/CampaignRules'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const FinancePanel = lazy(() => import('./pages/FinancePanel'));
const CouponManagement = lazy(() => import('./pages/CouponManagement'));
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'));

// Lazy load feature toggle management and new features
const FeatureManagement = lazy(() => import('./pages/FeatureManagement'));
const FleetTrackingDashboard = lazy(() => import('./pages/FleetTrackingDashboard'));
const DriverPerformance = lazy(() => import('./pages/DriverPerformance'));
const DelayCompensationPanel = lazy(() => import('./pages/DelayCompensationPanel'));
const RevenueAnalytics = lazy(() => import('./pages/RevenueAnalytics'));
const CorporateClients = lazy(() => import('./pages/CorporateClients'));

// Lazy load blog management
const BlogManagement = lazy(() => import('./pages/BlogManagement'));

// Lazy load optional components (only load when needed)
const LiveChat = lazy(() => import('./components/LiveChat'));
const Feedback = lazy(() => import('./components/Feedback'));
const FAQBot = lazy(() => import('./components/FAQBot'));
 
// Main User Layout
const MainLayout = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
        <div className="flex justify-center gap-4 py-8 bg-white shadow rounded-lg mt-8">
          <div className="text-center p-4 border rounded">
            <h3 className="font-bold">{t('guarantees.fixedPrice')}</h3>
            <p className="text-sm">{t('guarantees.noHiddenFees')}</p>
          </div>
          <div className="text-center p-4 border rounded">
            <h3 className="font-bold">{t('guarantees.freeCancellation')}</h3>
            <p className="text-sm">{t('guarantees.cancellationPolicy')}</p>
          </div>
          <div className="text-center p-4 border rounded">
            <h3 className="font-bold">{t('guarantees.flightTracking')}</h3>
            <p className="text-sm">{t('guarantees.weMonitor')}</p>
          </div>
        </div>
      </main>
      <Footer />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <FloatingLanguageButton />
      <Suspense fallback={null}>
        <LiveChat />
      </Suspense>
    </div>
  );
};
 
// Admin Panel Layout
const AdminLayout = () => {
  const { loading } = useAuth();
  if (loading) return <Loading />;
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
 
function App() {
  return (
    <ErrorBoundary fallbackMessage="GNB Transfer application encountered an error. Please refresh the page.">
      <I18nextProvider i18n={i18n}>
        <Router>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
              {/* Ana Kullanıcı Rotaları */}
              <Route path="/" element={<MainLayout />}> 
                <Route index element={<Home />} />
                <Route path="tours" element={<Tours />} />
                <Route path="booking" element={<Booking />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password/:token" element={<ResetPassword />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:id" element={<BlogPost />} />
                <Route path="payment" element={<StripePayment />} />
                <Route path="reviews" element={<Suspense fallback={<Loading />}><Feedback /></Suspense>} />
                <Route path="contact" element={<Contact />} />
                <Route path="faq" element={<Suspense fallback={<Loading />}><FAQBot /></Suspense>} />
              </Route>
 
              {/* Admin Paneli Rotaları (Korunmuş) */}
              <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'manager']}><AdminLayout /></PrivateRoute>}> 
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="ai" element={<AIAdminPanel />} />
                <Route path="marketing" element={<AIMarketingPanel />} />
                <Route path="vehicles" element={<VehicleManagement />} />
                <Route path="modules" element={<ModuleManagement />} />
                <Route path="campaigns" element={<CampaignRules />} />
                <Route path="insights" element={<AIInsights />} />
                <Route path="notifications" element={<NotificationSettings />} />
                <Route path="calendar" element={<CalendarView />} />
                <Route path="logs" element={<ActivityLogs />} />
                <Route path="finance" element={<FinancePanel />} />
                <Route path="coupons" element={<CouponManagement />} />
                <Route path="referrals" element={<ReferralProgram />} />
                
                {/* Feature Toggle Management */}
                <Route path="features" element={<FeatureManagement />} />
                
                {/* New Feature Toggle Routes */}
                <Route path="fleet" element={<FleetTrackingDashboard />} />
                <Route path="drivers/performance" element={<DriverPerformance />} />
                <Route path="delay-compensation" element={<DelayCompensationPanel />} />
                <Route path="analytics" element={<RevenueAnalytics />} />
                <Route path="corporate" element={<CorporateClients />} />
                
                {/* Blog Management */}
                <Route path="blog" element={<BlogManagement />} />
              </Route>
              
              {/* Sürücü Paneli Rotası */}
              <Route path="/driver" element={<PrivateRoute allowedRoles={['driver']}><DriverPanel /></PrivateRoute>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </I18nextProvider>
    </ErrorBoundary>
  );
}
 
export default App;