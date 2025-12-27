import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { languages } from '../i18n';

function Header() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [dynamicMenuItems, setDynamicMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const languageMenuRef = useRef(null);

  // Fetch dynamic menu items
  useEffect(() => {
    const fetchHeaderMenu = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/menus/header`);
        const result = await response.json();
        if (result.success && result.data.items) {
          setDynamicMenuItems(result.data.items);
        }
      } catch (err) {
        console.error('Error fetching header menu:', err);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchHeaderMenu();
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLanguageMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current language info
  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.h1
              className="text-2xl font-bold"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              GNB Transfer
            </motion.h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse">
            {/* Static fallback links - shown if dynamic menu is empty or loading */}
            {(!menuLoading && dynamicMenuItems.length === 0) && (
              <>
                <Link to="/" className="hover:text-blue-200 transition-colors duration-200">
                  {t('header.home')}
                </Link>
                <Link to="/tours" className="hover:text-blue-200 transition-colors duration-200">
                  {t('header.tours')}
                </Link>
                <Link to="/booking" className="hover:text-blue-200 transition-colors duration-200">
                  {t('header.booking')}
                </Link>
                <Link to="/blog" className="hover:text-blue-200 transition-colors duration-200">
                  {t('header.blog')}
                </Link>
              </>
            )}

            {/* Dynamic menu items */}
            {dynamicMenuItems.map((item, index) => (
              item.type === 'external' ? (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-200 transition-colors duration-200 flex items-center gap-1"
                >
                  {item.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <Link
                  key={index}
                  to={item.url}
                  className="hover:text-blue-200 transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )
            ))}

            {user?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="hover:text-blue-200 transition-colors duration-200"
              >
                {t('header.adminPanel')}
              </Link>
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
                <Link to="/login" className="hover:text-blue-200 transition-colors duration-200">
                  {t('header.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  {t('header.register')}
                </Link>
              </>
            )}
          </nav>

          {/* Language Selector - Desktop */}
          <div className="hidden lg:block relative" ref={languageMenuRef}>
            <button
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors duration-200 flex items-center gap-2"
              aria-label={t('languageSwitcher.selectLanguage')}
            >
              <span className="text-lg">{currentLanguage.flag}</span>
              <span className="font-medium">{currentLanguage.code.toUpperCase()}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <AnimatePresence>
              {isLanguageMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute end-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl py-2 min-w-[180px] max-h-[400px] overflow-y-auto z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-start px-4 py-2.5 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-3 ${
                        i18n.language === lang.code ? 'bg-blue-100 text-blue-600' : ''
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium">{lang.nativeName}</span>
                      {i18n.language === lang.code && (
                        <svg
                          className="w-4 h-4 ms-auto text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
              {/* Static fallback links - shown if dynamic menu is empty or loading */}
              {(!menuLoading && dynamicMenuItems.length === 0) && (
                <>
                  <Link
                    to="/"
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.home')}
                  </Link>
                  <Link
                    to="/tours"
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.tours')}
                  </Link>
                  <Link
                    to="/booking"
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.booking')}
                  </Link>
                  <Link
                    to="/blog"
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.blog')}
                  </Link>
                </>
              )}

              {/* Dynamic menu items */}
              {dynamicMenuItems.map((item, index) => (
                item.type === 'external' ? (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label} ↗
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.url}
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}

              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('header.adminPanel')}
                </Link>
              )}

              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-start bg-red-500 hover:bg-red-600 py-2 px-4 rounded transition-colors duration-200"
                >
                  {t('header.logout')}
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block py-2 px-4 hover:bg-blue-700 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 px-4 bg-white text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('header.register')}
                  </Link>
                </>
              )}

              {/* Language Selector for Mobile */}
              <div className="pt-2 border-t border-blue-500">
                <p className="px-4 py-2 text-sm text-blue-200">{t('header.language')}</p>
                <div className="grid grid-cols-3 gap-2 px-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`py-2 px-2 rounded transition-colors duration-200 flex flex-col items-center gap-1 ${
                        i18n.language === lang.code
                          ? 'bg-white text-blue-600'
                          : 'bg-blue-700 hover:bg-blue-800'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-xs">{lang.code.toUpperCase()}</span>
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
