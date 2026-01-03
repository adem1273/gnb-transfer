/**
 * Utility functions for formatting dates, currency, and phone numbers
 * Shared between web and mobile applications
 */

/**
 * Format a date to a localized string
 * @param date - Date to format (Date object, string, or timestamp)
 * @param locale - Locale string (e.g., 'en-US', 'tr-TR')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date to a short format (e.g., "Jan 15, 2024")
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Formatted date string
 */
export const formatDateShort = (
  date: Date | string | number,
  locale = 'en-US'
): string => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date to include time (e.g., "Jan 15, 2024, 2:30 PM")
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string | number,
  locale = 'en-US'
): string => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Format time only (e.g., "2:30 PM")
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string | number,
  locale = 'en-US'
): string => {
  return formatDate(date, locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Format a date relative to now (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Relative time string
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale = 'en-US'
): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) {
      return rtf.format(diffSec, 'second');
    } else if (Math.abs(diffMin) < 60) {
      return rtf.format(diffMin, 'minute');
    } else if (Math.abs(diffHour) < 24) {
      return rtf.format(diffHour, 'hour');
    } else {
      return rtf.format(diffDay, 'day');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Format ISO date string for API (YYYY-MM-DD)
 * @param date - Date to format
 * @returns ISO date string
 */
export const formatISODate = (date: Date | string | number): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting ISO date:', error);
    return '';
  }
};

/**
 * Format currency with locale support
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale string
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount}`;
  }
};

/**
 * Format currency in Turkish Lira
 * @param amount - Amount to format
 * @returns Formatted TRY currency string
 */
export const formatTRY = (amount: number): string => {
  return formatCurrency(amount, 'TRY', 'tr-TR');
};

/**
 * Format currency in US Dollars
 * @param amount - Amount to format
 * @returns Formatted USD currency string
 */
export const formatUSD = (amount: number): string => {
  return formatCurrency(amount, 'USD', 'en-US');
};

/**
 * Format currency in Euros
 * @param amount - Amount to format
 * @returns Formatted EUR currency string
 */
export const formatEUR = (amount: number): string => {
  return formatCurrency(amount, 'EUR', 'de-DE');
};

/**
 * Format a number with thousands separators
 * @param number - Number to format
 * @param locale - Locale string
 * @returns Formatted number string
 */
export const formatNumber = (number: number, locale = 'en-US'): string => {
  try {
    return new Intl.NumberFormat(locale).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return `${number}`;
  }
};

/**
 * Format a phone number for display
 * Attempts to format with proper grouping
 * @param phone - Phone number to format
 * @param countryCode - Country code (default: +90)
 * @returns Formatted phone number
 */
export const formatPhone = (phone: string, countryCode = '+90'): string => {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with country code, remove it for formatting
  let localNumber = cleaned;
  if (cleaned.startsWith(countryCode)) {
    localNumber = cleaned.substring(countryCode.length);
  } else if (cleaned.startsWith(countryCode.replace('+', ''))) {
    localNumber = cleaned.substring(countryCode.length - 1);
  }

  // Remove any remaining leading zeros
  localNumber = localNumber.replace(/^0+/, '');

  // Format Turkish phone numbers (10 digits: 5XX XXX XX XX)
  if (localNumber.length === 10 && countryCode === '+90') {
    return `${countryCode} ${localNumber.substring(0, 3)} ${localNumber.substring(3, 6)} ${localNumber.substring(6, 8)} ${localNumber.substring(8, 10)}`;
  }

  // Generic formatting for other numbers
  if (localNumber.length >= 7) {
    return `${countryCode} ${localNumber}`;
  }

  return phone;
};

/**
 * Format a phone number for WhatsApp link
 * @param phone - Phone number
 * @param countryCode - Country code (default: +90)
 * @returns WhatsApp-compatible phone string
 */
export const formatPhoneForWhatsApp = (phone: string, countryCode = '+90'): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  const cleanCountryCode = countryCode.replace(/\D/g, '');

  // If number doesn't start with country code, prepend it
  if (!cleaned.startsWith(cleanCountryCode)) {
    return `${cleanCountryCode}${cleaned}`;
  }

  return cleaned;
};

/**
 * Get WhatsApp link for a phone number
 * @param phone - Phone number
 * @param countryCode - Country code (default: +90)
 * @param message - Optional pre-filled message
 * @returns WhatsApp URL
 */
export const getWhatsAppLink = (
  phone: string,
  countryCode = '+90',
  message?: string
): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone, countryCode);
  const baseUrl = `https://wa.me/${formattedPhone}`;

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return baseUrl;
};

/**
 * Format a percentage
 * @param value - Value to format (0-100 or 0-1)
 * @param isDecimal - If true, treats value as decimal (0-1)
 * @param locale - Locale string
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number,
  isDecimal = false,
  locale = 'en-US'
): string => {
  try {
    const normalizedValue = isDecimal ? value : value / 100;
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(normalizedValue);
  } catch (error) {
    console.error('Error formatting percent:', error);
    return `${value}%`;
  }
};

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes < 0) return '';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Export all formatters
export const formatters = {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatISODate,
  formatCurrency,
  formatTRY,
  formatUSD,
  formatEUR,
  formatNumber,
  formatPhone,
  formatPhoneForWhatsApp,
  getWhatsAppLink,
  formatPercent,
  formatDuration,
  truncateText,
  capitalizeWords,
};

export default formatters;
