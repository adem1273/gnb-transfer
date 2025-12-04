export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  EXPORT_MAX_LIMIT: 10000,
} as const;

export const BOOKING = {
  MIN_GUESTS: 1,
  MAX_GUESTS: 50,
  NOTES_MAX_LENGTH: 500,
} as const;

export const PASSWORD = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
} as const;

export const RATE_LIMITS = {
  STRICT_WINDOW_MS: 15 * 60 * 1000,
  STRICT_MAX_REQUESTS: 5,
  GLOBAL_WINDOW_MS: 60 * 1000,
  GLOBAL_MAX_REQUESTS: 100,
} as const;

export const TOKEN = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '30d',
} as const;

export const DATABASE = {
  MAX_RETRIES: 5,
  RETRY_DELAY_MS: 5000,
  SERVER_SELECTION_TIMEOUT_MS: 5000,
  HEARTBEAT_FREQUENCY_MS: 10000,
} as const;

export type PaginationConfig = typeof PAGINATION;
export type BookingConfig = typeof BOOKING;
export type PasswordConfig = typeof PASSWORD;
export type RateLimitsConfig = typeof RATE_LIMITS;
export type TokenConfig = typeof TOKEN;
export type DatabaseConfig = typeof DATABASE;
