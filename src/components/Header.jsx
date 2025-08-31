import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next'; // <-- Yeni import

function Header() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation(); // <-- useTranslation hook'unu kullan

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">GNB Transfer</h1>
      </div>
      <nav className="space-x-4">
        <Link to="/" className="hover:underline">{t('header.home')}</Link>
        <Link to="/tours" className="hover:underline">{t('header.tours')}</Link>
        <Link to="/booking" className="hover:underline">{t('header.booking')}</Link>
        <Link to="/blog" className="hover:underline">{t('header.blog')}</Link>
        
        {user?.role === 'admin' && (
          <Link to="/admin/dashboard" className="hover:underline">{t('header.adminPanel')}</Link>
        )}
        
        {user ? (
          <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">
            {t('header.logout')}
          </button>
        ) : (
          <>
            <Link to="/login" className="hover:underline">{t('header.login')}</Link>
            <Link to="/register" className="hover:underline">{t('header.register')}</Link>
          </>
        )}
      </nav>
      {/* Dil Seçenekleri */}
      <div className="flex items-center space-x-2">
        <button onClick={() => changeLanguage('en')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">EN</button>
        <button onClick={() => changeLanguage('ar')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">AR</button>
        <button onClick={() => changeLanguage('ru')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">RU</button>
        <button onClick={() => changeLanguage('es')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">ES</button>
        <button onClick={() => changeLanguage('zh')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">ZH</button>
        <button onClick={() => changeLanguage('hi')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">HI</button>
        <button onClick={() => changeLanguage('de')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">DE</button>
        <button onClick={() => changeLanguage('it')} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">IT</button>
      </div>
    </header>
  );
}

export default Header;