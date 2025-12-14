# Sentry Error Monitoring Setup Guide

This guide explains how to set up and use Sentry for error monitoring in the GNB Transfer application.

## What is Sentry?

Sentry is a real-time error tracking platform that helps you monitor and fix crashes in production. It automatically captures exceptions, provides detailed error reports with stack traces, and helps you identify performance issues.

## Features

✅ **Real-time error tracking** - Get notified immediately when errors occur  
✅ **Stack traces** - See exactly where errors happened in your code  
✅ **Performance monitoring** - Track slow API calls and page loads  
✅ **User context** - Know which users are affected by errors  
✅ **Environment separation** - Different tracking for dev/staging/production  
✅ **Error filtering** - Avoid noise by filtering validation errors  
✅ **Session replay** - See exactly what users did before an error occurred  

## Quick Start

### 1. Create a Sentry Account (FREE)

1. Go to [sentry.io](https://sentry.io/signup/)
2. Sign up for a **free account** (60k events/month - more than enough for most apps)
3. Create a new project:
   - Platform: **Node.js** (for backend)
   - Platform: **React** (for frontend)
4. Copy your DSN (Data Source Name) - it looks like:
   ```
   https://abc123def456@o123456.ingest.sentry.io/789012
   ```

### 2. Configure Backend

Add to `backend/.env`:

```env
# Sentry Error Tracking
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
NODE_ENV=production
SERVER_NAME=gnb-backend-prod
```

That's it! The backend is already integrated. Errors will automatically be sent to Sentry.

### 3. Configure Frontend

Add to `.env` (root directory):

```env
# Sentry Error Tracking
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

The frontend is also already integrated. Rebuild your app to enable Sentry:

```bash
npm run build
```

### 4. Test Error Capture

**Backend Test:**

```bash
curl http://localhost:5000/api/test-error
```

**Frontend Test:**

Open your app and navigate to a page that doesn't exist, or add this temporary button:

```jsx
<button onClick={() => { throw new Error('Test error'); }}>
  Test Sentry
</button>
```

## Environment Separation

Sentry is configured to work differently in each environment:

### Development
- ❌ Sentry **disabled** (errors logged to console only)
- ✅ Full error details in console
- ✅ No quota usage

### Production
- ✅ Sentry **enabled** (errors sent to Sentry)
- ✅ 10% performance sampling (saves quota)
- ✅ Error filtering (no validation errors)
- ✅ Session replay on errors

## What Gets Sent to Sentry?

### ✅ Captured Errors
- Server errors (500, 502, 503, etc.)
- Uncaught exceptions
- React component errors (via ErrorBoundary)
- Async/Promise rejections
- Critical application errors

### ❌ Filtered Errors (NOT sent to Sentry)
- Validation errors (400 Bad Request)
- Authentication failures (401 Unauthorized)
- Not found errors (404)
- Network timeouts (temporary issues)
- Browser extension errors

## Using Sentry in Code

### Backend

```javascript
import { captureException, captureMessage, setUser } from './config/sentry.mjs';

// Capture an exception
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    operation: 'riskyOperation',
    userId: user.id,
  });
}

// Capture a message
captureMessage('Something unusual happened', 'warning', {
  context: 'payment-processing',
});

// Set user context
setUser({
  id: user._id,
  email: user.email,
  name: user.name,
});
```

### Frontend

```javascript
import { captureException, captureMessage, setUser } from './config/sentry';

// Capture an exception
try {
  await fetchData();
} catch (error) {
  captureException(error, {
    component: 'BookingForm',
    action: 'submit',
  });
}

// Set user context after login
setUser({
  id: user._id,
  email: user.email,
  name: user.name,
});

// Clear user context after logout
import { clearUser } from './config/sentry';
clearUser();
```

## Advanced Features

### Performance Monitoring

Track slow API calls and page loads:

```javascript
// Backend - automatically tracked via Sentry.Handlers.tracingHandler()
// No code changes needed

// Frontend - automatically tracked via BrowserTracing integration
// No code changes needed
```

### Breadcrumbs

Add context to understand what happened before an error:

```javascript
import { addBreadcrumb } from './config/sentry';

addBreadcrumb('User clicked checkout button', {
  cart_total: 150,
  items: 3,
});
```

### Session Replay

See exactly what users did before an error (frontend only):

- Automatically enabled for 10% of sessions
- 100% of sessions with errors are recorded
- Text is masked for privacy
- Media is blocked for bandwidth

## Dashboard & Alerts

### View Errors in Sentry

1. Go to [sentry.io](https://sentry.io)
2. Click on your project
3. View **Issues** to see all errors
4. Click an issue to see:
   - Stack trace
   - User who experienced it
   - Breadcrumbs (what they did before the error)
   - Request details
   - Environment info

### Set Up Alerts

1. Go to **Alerts** in Sentry
2. Create alert rules:
   - Email on new errors
   - Slack notifications
   - PagerDuty integration
3. Configure frequency:
   - Immediate for critical errors
   - Daily digest for minor issues

## Best Practices

### DO ✅

- Use Sentry in production
- Add user context after login
- Add breadcrumbs for important actions
- Review errors daily
- Create issues in your bug tracker from Sentry
- Use release tracking (`VITE_APP_VERSION`)

### DON'T ❌

- Don't enable Sentry in development (wastes quota)
- Don't send validation errors to Sentry
- Don't expose Sentry DSN in client code (it's public but rate-limited)
- Don't ignore Sentry alerts
- Don't capture sensitive data (passwords, credit cards)

## Quota Management

Free Sentry plan includes:

- **60,000 errors/month** (should be more than enough)
- **10,000 performance transactions/month**
- **1 GB session replays**

To stay within quota:

1. **Filter errors** - We filter validation errors automatically
2. **Sample in production** - We sample 10% of performance data
3. **Monitor usage** - Check Sentry dashboard monthly
4. **Adjust sampling** - Reduce `tracesSampleRate` if needed

## Troubleshooting

### Errors Not Showing in Sentry

1. ✅ Check `SENTRY_DSN` or `VITE_SENTRY_DSN` is set
2. ✅ Verify you're in **production** mode (`NODE_ENV=production`)
3. ✅ Check Sentry dashboard for quota limits
4. ✅ Look for error filters in `config/sentry.mjs` or `config/sentry.js`
5. ✅ Check browser console for Sentry initialization logs

### Too Many Errors

1. **Investigate root cause** - Don't just ignore them
2. **Filter noise** - Add filters in `beforeSend`
3. **Fix common errors** - Focus on high-volume issues
4. **Rate limiting** - Sentry has built-in rate limiting

### Performance Impact

Sentry has **minimal performance impact**:

- Backend: ~1-2ms per request
- Frontend: ~100KB bundle size
- Performance monitoring is sampled (10%)
- Async error reporting

## Cost

Sentry is **FREE** for:

- Up to 60,000 errors/month
- 1 project
- Unlimited team members
- 30 days data retention

This is perfect for small to medium applications.

## Support

- **Sentry Docs**: https://docs.sentry.io/
- **Sentry Status**: https://status.sentry.io/
- **Community**: https://forum.sentry.io/

## Summary

Sentry is now integrated into both the backend and frontend. To use it:

1. ✅ Sign up at sentry.io (FREE)
2. ✅ Add DSN to environment variables
3. ✅ Deploy to production
4. ✅ Errors will be automatically tracked

No additional code changes needed - everything is already set up! 🎉
