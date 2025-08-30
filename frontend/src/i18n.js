import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Çeviri dosyalarını içe aktar
import translationEN from './locales/en/translation.json';
import translationAR from './locales/ar/translation.json';
import translationRU from './locales/ru/translation.json';
import translationES from './locales/es/translation.json';
import translationZH from './locales/zh/translation.json';
import translationHI from './locales/hi/translation.json';
import translationDE from './locales/de/translation.json';
import translationIT from './locales/it/translation.json';

// Çeviri kaynakları
const resources = {
  en: {
    translation: translationEN
  },
  ar: {
    translation: translationAR
  },
  ru: {
    translation: translationRU
  },
  es: {
    translation: translationES
  },
  zh: {
    translation: translationZH
  },
  hi: {
    translation: translationHI
  },
  de: {
    translation: translationDE
  },
  it: {
    translation: translationIT
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Eğer kullanıcının dili bulunamazsa İngilizce'yi kullan
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie']
    },
    interpolation: {
      escapeValue: false, // React XSS saldırılarına karşı zaten koruma sağlar
    },
    react: {
      useSuspense: false, // Sayfa yüklenmeden metnin görünmesini engeller
    }
  });

export default i18n;