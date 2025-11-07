import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

function Header() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLanguageMenuOpen(false);
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
    { code: 'ru', label: 'RU' },
    { code: 'es', label: 'ES' },
    { code: 'zh', label: 'ZH' },
    { code: 'hi', label: 'HI' },
    { code: 'de', label: 'DE' },
    { code: 'it', label: 'IT' },
  ];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.h1 
              className="text-2xl font-bold"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              GNB Transfer
            </motion.h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition-colors duration-200">{t('header.home')}</Link>
            <Link to="/tours" className="hover:text-blue-200 transition-colors duration-200">{t('header.tours')}</Link>
            <Link to="/booking" className="hover:text-blue-200 transition-colors duration-200">{t('header.booking')}</Link>
            <Link to="/blog" className="hover:text-blue-200 transition-colors duration-200">{t('header.blog')}</Link>
            
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="hover:text-blue-200 transition-colors duration-200">{t('header.adminPanel')}</Link>
            )}
            
            {user ? (
              <motion.button 
                onClick={logout} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('header.logout')}
              </motion.button>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition-colors duration-200">{t('header.login')}</Link>
                <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">{t('header.register')}</Link>
              </>
            )}
          </nav>

          {/* Language Selector */}
          <div className="hidden lg:block relative">
            <button 
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 flex items-center gap-2"
              aria-label="Select language"
            >
              <span>{i18n.language.toUpperCase()}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {isLanguageMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl py-2 min-w-[120px]"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="block w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-200"
                    >
                      {lang.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden pb-4 space-y-2"
            >
              <Link to="/" className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.home')}</Link>
              <Link to="/tours" className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.tours')}</Link>
              <Link to="/booking" className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.booking')}</Link>
              <Link to="/blog" className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.blog')}</Link>
              
              {user?.role === 'admin' && (
                <Link to="/admin/dashboard" className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.adminPanel')}</Link>
              )}
              
              {user ? (
                <button 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left bg-red-500 hover:bg-red-600 py-2 px-4 rounded transition-colors duration-200"
                >
                  {t('header.logout')}
                </button>
              ) : (
                <>
                  <Link to="/login" className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.login')}</Link>
                  <Link to="/register" className="block py-2 px-4 bg-white text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200" onClick={() => setIsMobileMenuOpen(false)}>{t('header.register')}</Link>
                </>
              )}

              {/* Language Selector for Mobile */}
              <div className="pt-2 border-t border-blue-500">
                <p className="px-4 py-2 text-sm text-blue-200">{t('header.language') || 'Language'}</p>
                <div className="grid grid-cols-4 gap-2 px-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang.code); setIsMobileMenuOpen(false); }}
                      className={`py-2 px-3 rounded transition-colors duration-200 ${
                        i18n.language === lang.code ? 'bg-white text-blue-600' : 'bg-blue-700 hover:bg-blue-800'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

export default Header;