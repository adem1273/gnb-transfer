import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveChat from '../components/LiveChat';

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
      <LiveChat />
    </div>
  );
};

export default MainLayout;
