/**
 * Sentry Crash Reporting for Mobile App
 *
 * ⚠️ FREE TIER ONLY - This configuration is designed to stay within free tier limits.
 *
 * Configuration Rules (FREE TIER SAFE):
 * - Performance monitoring is DISABLED (tracesSampleRate: 0)
 * - Session tracking is DISABLED (autoSessionTracking: false)
 * - NO profiling, replay, or experimental features
 * - NO sensitive data in breadcrumbs
 * - ONLY captures crash/error events
 *
 * Security & Privacy:
 * - Never sends tokens, personal data, or API payloads
 * - Never logs auth headers or request bodies
 * - Error reporting is minimal and anonymized
 *
 * @module sentry
 */

import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry for crash reporting.
 * ONLY initializes in production builds (__DEV__ is false).
 *
 * This function should be called once at app startup before any other code runs.
 */
export function initSentry(): void {
  // Only initialize in production builds
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[Sentry] Development mode - crash reporting disabled');
    return;
  }

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Skip initialization if no DSN is provided
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.log('[Sentry] No DSN provided - crash reporting disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,

      // ============================================
      // FREE TIER SAFE CONFIGURATION
      // ============================================

      // DISABLE performance monitoring completely (FREE TIER)
      tracesSampleRate: 0,

      // DISABLE automatic session tracking (FREE TIER)
      autoSessionTracking: false,

      // Environment identification
      environment: 'production',

      // ============================================
      // ERROR FILTERING
      // ============================================

      beforeSend(event, hint) {
        const error = hint.originalException;

        // Filter out validation errors (not crashes)
        if (error instanceof Error && error.message) {
          const message = error.message.toLowerCase();

          // Skip validation errors - these are expected behavior
          if (
            message.includes('validation') ||
            message.includes('invalid input') ||
            message.includes('required field')
          ) {
            return null;
          }

          // Skip network errors handled gracefully elsewhere
          if (
            message.includes('network request failed') ||
            message.includes('failed to fetch') ||
            message.includes('timeout')
          ) {
            return null;
          }
        }

        return event;
      },

      // ============================================
      // PRIVACY & SECURITY
      // ============================================

      // Disable attaching user information automatically
      attachStacktrace: true,

      // Default breadcrumb settings - we'll filter sensitive ones
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'http') {
          // Don't log HTTP request details (may contain tokens)
          return null;
        }

        if (breadcrumb.category === 'console') {
          // Don't log console messages (may contain sensitive data)
          return null;
        }

        if (breadcrumb.category === 'navigation') {
          // Allow navigation breadcrumbs but strip query params
          if (breadcrumb.data?.to && typeof breadcrumb.data.to === 'string') {
            const url = breadcrumb.data.to;
            const cleanUrl = url.split('?')[0];
            breadcrumb.data.to = cleanUrl;
          }
          return breadcrumb;
        }

        return breadcrumb;
      },

      // ============================================
      // DISABLED FEATURES (FREE TIER / PRIVACY)
      // ============================================

      // No profiling (paid feature)
      // No replay (paid feature)
      // No experimental features

      // Debug mode off in production
      debug: false,
    });

    // eslint-disable-next-line no-console
    console.log('[Sentry] Crash reporting initialized (FREE tier)');
  } catch (error) {
    // Silent fail - don't crash the app if Sentry fails to initialize
    // eslint-disable-next-line no-console
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture an unexpected runtime exception.
 *
 * Use this ONLY for unexpected runtime errors that indicate bugs or crashes.
 *
 * DO NOT use for:
 * - Validation errors (expected user input issues)
 * - Network errors already handled gracefully
 * - Expected error states
 *
 * @param error - The error to capture
 * @param context - Optional additional context (NO sensitive data!)
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureException(error, { operation: 'riskyOperation' });
 * }
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, string | number | boolean>
): void {
  // Skip in development
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error('[Sentry Dev] Exception captured:', error, context);
    return;
  }

  // Skip if Sentry is not configured
  if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
    return;
  }

  try {
    Sentry.captureException(error, {
      extra: context,
    });
  } catch {
    // Silent fail - don't crash if Sentry fails
  }
}

/**
 * Sentry Error Boundary component for React.
 *
 * Use this to wrap parts of your app that should catch and report rendering errors.
 * The ErrorBoundary will catch errors during rendering, in lifecycle methods,
 * and in constructors of the whole tree below it.
 *
 * @example
 * <SentryErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry for direct use if absolutely needed
export { Sentry };

export default {
  initSentry,
  captureException,
  SentryErrorBoundary,
};
