/**
 * i18next configuration for multi-language support
 * Loads all 11 languages from web public/locales directory
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, RTL_LANGUAGES, SUPPORTED_LANGUAGES } from '../constants';

// Import translation files
// These are imported from the web app's locales directory
import translationTR from '../../../src/locales/tr/translation.json';
import translationEN from '../../../src/locales/en/translation.json';
import translationAR from '../../../src/locales/ar/translation.json';
import translationRU from '../../../src/locales/ru/translation.json';
import translationDE from '../../../src/locales/de/translation.json';
import translationFR from '../../../src/locales/fr/translation.json';
import translationES from '../../../src/locales/es/translation.json';
import translationZH from '../../../src/locales/zh/translation.json';
import translationFA from '../../../src/locales/fa/translation.json';
import translationHI from '../../../src/locales/hi/translation.json';
import translationIT from '../../../src/locales/it/translation.json';

// Translation resources
const resources = {
  tr: { translation: translationTR },
  en: { translation: translationEN },
  ar: { translation: translationAR },
  ru: { translation: translationRU },
  de: { translation: translationDE },
  fr: { translation: translationFR },
  es: { translation: translationES },
  zh: { translation: translationZH },
  fa: { translation: translationFA },
  hi: { translation: translationHI },
  it: { translation: translationIT },
};

/**
 * Check if a language is RTL (Right-to-Left)
 * @param lang - Language code
 * @returns true if the language is RTL
 */
export const isRTL = (lang: string): boolean => {
  return RTL_LANGUAGES.includes(lang as typeof RTL_LANGUAGES[number]);
};

/**
 * Get language configuration by code
 * @param code - Language code
 * @returns Language configuration or undefined
 */
export const getLanguageConfig = (code: string) => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
};

/**
 * Get all supported language codes
 * @returns Array of language codes
 */
export const getSupportedLanguageCodes = (): string[] => {
  return SUPPORTED_LANGUAGES.map((lang) => lang.code);
};

/**
 * Initialize i18next with configuration
 * Call this function in your app entry point
 * @param options - Optional configuration overrides
 */
export const initI18n = async (options?: {
  lng?: string;
  fallbackLng?: string;
  debug?: boolean;
  onLanguageChanged?: (lng: string) => void;
}) => {
  const { lng, fallbackLng, debug, onLanguageChanged } = options || {};

  await i18n.use(initReactI18next).init({
    resources,
    lng: lng || DEFAULT_LANGUAGE,
    fallbackLng: fallbackLng || FALLBACK_LANGUAGE,
    supportedLngs: getSupportedLanguageCodes(),
    debug: debug ?? false,
    interpolation: {
      escapeValue: false, // React already protects against XSS
    },
    react: {
      useSuspense: false, // Prevents text from appearing before page loads
    },
  });

  // Register language change handler if provided
  if (onLanguageChanged) {
    i18n.on('languageChanged', onLanguageChanged);
  }

  return i18n;
};

/**
 * Change the current language
 * @param lng - Language code to switch to
 */
export const changeLanguage = async (lng: string): Promise<void> => {
  if (getSupportedLanguageCodes().includes(lng)) {
    await i18n.changeLanguage(lng);
  } else {
    console.warn(`Language ${lng} is not supported. Falling back to ${FALLBACK_LANGUAGE}`);
    await i18n.changeLanguage(FALLBACK_LANGUAGE);
  }
};

/**
 * Get the current language
 * @returns Current language code
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || DEFAULT_LANGUAGE;
};

/**
 * Get translation function
 * @returns The i18n t function
 */
export const getTranslation = () => {
  return i18n.t.bind(i18n);
};

// Export the configured i18n instance
export { i18n };
export { resources };

// Re-export language constants
export { SUPPORTED_LANGUAGES, RTL_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE };

export default i18n;
