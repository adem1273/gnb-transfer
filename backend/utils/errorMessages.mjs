/**
 * Error Messages
 *
 * @module utils/errorMessages
 * @description Centralized multilingual error messages for the application
 */

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: { en: 'Invalid email or password', tr: 'Geçersiz e-posta veya şifre' },
  TOKEN_EXPIRED: {
    en: 'Session expired. Please log in again.',
    tr: 'Oturum sona erdi. Tekrar giriş yapın.',
  },
  UNAUTHORIZED: { en: 'Not authorized', tr: 'Yetkiniz yok' },
  TOUR_NOT_FOUND: { en: 'Tour not found', tr: 'Tur bulunamadı' },
  BOOKING_FAILED: { en: 'Booking failed', tr: 'Rezervasyon başarısız' },
  INVALID_COUPON: { en: 'Invalid coupon', tr: 'Geçersiz kupon' },
  COUPON_EXPIRED: { en: 'Coupon expired', tr: 'Kupon süresi dolmuş' },
  SERVER_ERROR: { en: 'Server error. Try again later.', tr: 'Sunucu hatası. Daha sonra deneyin.' },
  RATE_LIMIT: { en: 'Too many requests. Please wait.', tr: 'Çok fazla istek. Bekleyin.' },
};

export const getErrorMessage = (key, lang = 'en') => {
  const msg = ERROR_MESSAGES[key];
  return msg ? msg[lang] || msg.en : ERROR_MESSAGES.SERVER_ERROR[lang];
};

export default ERROR_MESSAGES;
