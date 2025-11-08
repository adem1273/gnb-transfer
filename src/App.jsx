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

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Tours = lazy(() => import('./pages/Tours'));
const Booking = lazy(() => import('./pages/Booking'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
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

// Lazy load optional components (only load when needed)
const LiveChat = lazy(() => import('./components/LiveChat'));
const Feedback = lazy(() => import('./components/Feedback'));
 
// Genel Kullanıcı Düzeni
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
      <Suspense fallback={null}>
        <LiveChat />
      </Suspense>
    </div>
  );
};
 
// Admin Paneli Düzeni
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
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:id" element={<BlogPost />} />
                <Route path="payment" element={<StripePayment />} />
                <Route path="reviews" element={<Suspense fallback={<Loading />}><Feedback /></Suspense>} />
                <Route path="contact" element={<Contact />} />
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