import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationTR from './locales/tr/translation.json';
import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';
import translationRU from './locales/ru/translation.json';
import translationDE from './locales/de/translation.json';
import translationFR from './locales/fr/translation.json';
import translationES from './locales/es/translation.json';
import translationZH from './locales/zh/translation.json';
import translationFA from './locales/fa/translation.json';

// Translation resources
const resources = {
  tr: {
    translation: translationTR,
  },
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
  ru: {
    translation: translationRU,
  },
  de: {
    translation: translationDE,
  },
  fr: {
    translation: translationFR,
  },
  es: {
    translation: translationES,
  },
  zh: {
    translation: translationZH,
  },
  fa: {
    translation: translationFA,
  },
};

// RTL languages
export const rtlLanguages = ['ar', 'fa'];

// Check if current language is RTL
export const isRTL = (lang) => rtlLanguages.includes(lang);

// Language configuration with flags and names
export const languages = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', nativeName: 'العربية', rtl: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', label: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'zh', label: '中文', flag: '🇨🇳', nativeName: '简体中文' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷', nativeName: 'فارسی', rtl: true },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tr', // Turkish as default/fallback
    supportedLngs: ['tr', 'en', 'ar', 'ru', 'de', 'fr', 'es', 'zh', 'fa'],
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    react: {
      useSuspense: false, // Prevents text from appearing before page loads
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = isRTL(lng) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);

  // Add or remove RTL class for Tailwind RTL support
  if (isRTL(lng)) {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
});

// Set initial direction based on current language
const currentLang = i18n.language || 'tr';
const initialDir = isRTL(currentLang) ? 'rtl' : 'ltr';
document.documentElement.setAttribute('dir', initialDir);
document.documentElement.setAttribute('lang', currentLang);
if (isRTL(currentLang)) {
  document.documentElement.classList.add('rtl');
}

export default i18n;
