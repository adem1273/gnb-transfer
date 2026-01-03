import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import fastRedact from 'fast-redact';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sensitive field redaction configuration
 * Redacts PII and sensitive data from logs to comply with GDPR and security best practices
 */
const redact = fastRedact({
  paths: [
    // Authentication & Authorization
    'authorization',
    'headers.authorization',
    'req.headers.authorization',
    'request.headers.authorization',
    'headers.cookie',
    'req.headers.cookie',
    'request.headers.cookie',
    'headers["set-cookie"]',
    'req.headers["set-cookie"]',
    'request.headers["set-cookie"]',
    'token',
    'accessToken',
    'refreshToken',
    'jwt',
    'bearer',

    // User credentials
    'password',
    'newPassword',
    'oldPassword',
    'confirmPassword',
    'currentPassword',
    'user.password',
    'body.password',
    'req.body.password',
    'request.body.password',
    'request.body.user.password',

    // Personal Identifiable Information (PII)
    'email',
    'user.email',
    'body.email',
    'req.body.email',
    'request.body.email',
    'request.body.user.email',

    // Payment information
    'creditCard',
    'cardNumber',
    'cvv',
    'cvc',
    'cardCvv',
    'pan',
    'stripe.card',
    'payment.card',
    'payment.creditCard',
    'payment.cvv',

    // PayTR payment secrets
    'paytr.merchantKey',
    'paytr.merchantSalt',
    'paytrToken',
    'env.PAYTR_MERCHANT_KEY',
    'env.PAYTR_MERCHANT_SALT',
    'PAYTR_MERCHANT_KEY',
    'PAYTR_MERCHANT_SALT',

    // API keys and secrets
    'apiKey',
    'api_key',
    'config.apiKey',
    'secret',
    'config.secret',
    'privateKey',
    'private_key',
    'env.MONGO_URI',
    'env.JWT_SECRET',
    'env.OPENAI_API_KEY',
    'env.STRIPE_SECRET_KEY',
    'MONGO_URI',
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
  ],
  censor: '[REDACTED]',
  serialize: true, // Serialize to JSON string
});

/**
 * Custom format to redact sensitive information
 */
const redactFormat = winston.format((info) => {
  // Clone the info object to avoid mutation
  const infoString = JSON.stringify(info);
  // Apply redaction
  const redactedString = redact(JSON.parse(infoString));
  // Parse back to object
  const redacted = JSON.parse(redactedString);
  return redacted;
});

// Define log format with redaction
const logFormat = winston.format.combine(
  redactFormat(), // Apply redaction first
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development with redaction
const consoleFormat = winston.format.combine(
  redactFormat(), // Apply redaction first
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  console.error('Failed to create logs directory:', error.message);
}

// Create transports
const transports = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  })
);

// File transports for production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  // Combined log file (all logs)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '14d',
      format: logFormat,
      level: 'info',
    })
  );

  // Error log file (errors only)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '14d',
      format: logFormat,
      level: 'error',
    })
  );

  // Access log file (HTTP requests)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '14d',
      format: logFormat,
    })
  );
}

// Create logger instance with exception and rejection handlers
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'gnb-backend',
    env: process.env.NODE_ENV || 'development',
  },
  transports,
  exitOnError: false,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    ...(process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true'
      ? [
          new DailyRotateFile({
            filename: path.join(logsDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
            format: logFormat,
          }),
        ]
      : []),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    ...(process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true'
      ? [
          new DailyRotateFile({
            filename: path.join(logsDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '14d',
            format: logFormat,
          }),
        ]
      : []),
  ],
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
