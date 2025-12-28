# Super Admin Core System - Implementation Summary

## Overview

This implementation adds a Super Admin Core system to the GNB Transfer backend without introducing multi-tenancy, new authentication flows, or environment variables. All changes follow the existing patterns and maintain backward compatibility.

## Features Implemented

### 1. Super Admin Role ✅

**Status:** Already existed in the codebase
- User model already supports `superadmin` role in the enum
- `requireSuperAdmin` middleware already exists in `adminGuard.mjs`
- Enforces strict role checking (only `superadmin` role allowed)

**Usage:**
```javascript
import { requireSuperAdmin } from '../middlewares/adminGuard.mjs';
router.post('/critical-action', requireAuth(), requireSuperAdmin, handler);
```

### 2. Global System Settings ✅

**Model:** Extended `GlobalSettings.mjs`

**New Fields:**
- `siteStatus` (enum: 'online' | 'maintenance') - Controls site availability
- `maintenanceMessage` (string, max 500 chars) - Displayed during maintenance
- `bookingEnabled` (boolean) - Enable/disable booking functionality
- `paymentEnabled` (boolean) - Enable/disable payment processing
- `registrationsEnabled` (boolean) - Enable/disable new user registrations
- `forceLogoutAll` (boolean) - Future use for invalidating all sessions

**Endpoints:**
- `GET /api/v1/super-admin/system-settings` - Get current system settings
- `PUT /api/v1/super-admin/system-settings` - Update system settings

**Example Request:**
```bash
curl -X PUT http://localhost:5000/api/v1/super-admin/system-settings \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "siteStatus": "online",
    "bookingEnabled": true,
    "paymentEnabled": true,
    "registrationsEnabled": true
  }'
```

### 3. Feature Flag Service ✅

**File:** `backend/services/featureFlagService.mjs`

**Functions:**
- `isFeatureEnabled(featureId)` - Check FeatureToggle model
- `isGlobalFlagEnabled(flagName)` - Check GlobalSettings feature flags
- `isSystemSettingEnabled(settingName)` - Check system setting flags
- `getSiteStatus()` - Get site status and maintenance message
- `areBookingsEnabled()` - Combined check for bookings (system + global flags)
- `arePaymentsEnabled()` - Combined check for payments (system + global flags)
- `areRegistrationsEnabled()` - Check if registrations are enabled

**Error Handling:**
- All functions return `false` on error instead of throwing
- Errors are logged but don't break functionality
- Safe to use in middleware and critical paths

**Usage Example:**
```javascript
import { areBookingsEnabled, getSiteStatus } from '../services/featureFlagService.mjs';

// Check if bookings are enabled
if (!(await areBookingsEnabled())) {
  return res.apiError('Bookings are currently disabled', 503);
}

// Check site status
const { status, message } = await getSiteStatus();
if (status === 'maintenance') {
  return res.apiError(message, 503);
}
```

### 4. Kill Switch ✅

**Endpoint:** `POST /api/v1/super-admin/kill-switch`

**Purpose:** Emergency shutdown of critical features

**Actions:**
- Sets `siteStatus` to 'maintenance'
- Disables `bookingEnabled`
- Disables `paymentEnabled`
- Sets custom maintenance message

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/v1/super-admin/kill-switch \
  -H "Authorization: Bearer <super_admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Emergency maintenance in progress",
    "reason": "Security incident detected"
  }'
```

**Restore Endpoint:** `POST /api/v1/super-admin/restore`

Restores normal operations:
- Sets `siteStatus` to 'online'
- Enables `bookingEnabled`
- Enables `paymentEnabled`
- Clears maintenance message

### 5. Audit Logging ✅

**Model:** Extended `AdminLog.mjs`

**New Action Types:**
- `SUPER_ADMIN_ACTION` - General super admin actions
- `KILL_SWITCH_ACTIVATED` - Emergency kill switch activation
- `SYSTEM_SETTINGS_UPDATE` - System settings changes
- `FEATURE_FLAG_CHANGE` - Feature flag modifications

**New Fields:**
- `endpoint` (string) - API endpoint that was called
- `method` (string) - HTTP method (GET, POST, PUT, DELETE)

**Middleware:** `backend/middlewares/auditLogger.mjs`

**Functions:**
- `logAdminAction(action, targetType)` - Generic admin action logger
- `logSuperAdminAction(targetType)` - Shorthand for super admin actions
- `logActionOutcome()` - Optional middleware to log action results

**Features:**
- Captures IP address (handles X-Forwarded-For proxy headers correctly)
- Logs user info (id, email, name, role)
- Logs target (type, id, name)
- Logs metadata (body, params, query)
- Non-blocking (doesn't fail request if logging fails)

**Usage:**
```javascript
import { logAdminAction } from '../middlewares/auditLogger.mjs';

router.post('/critical-action',
  requireAuth(),
  requireSuperAdmin,
  logAdminAction('CRITICAL_ACTION', 'System'),
  handler
);
```

**Querying Audit Logs:**
```javascript
// Get recent super admin actions
const logs = await AdminLog.find({ 
  action: { $in: ['SUPER_ADMIN_ACTION', 'KILL_SWITCH_ACTIVATED', 'SYSTEM_SETTINGS_UPDATE'] }
})
.sort({ createdAt: -1 })
.limit(100);

// Get actions by specific user
const userLogs = await AdminLog.find({ 'user.id': userId })
  .sort({ createdAt: -1 });

// Get actions on specific target
const targetLogs = await AdminLog.find({ 'target.type': 'SystemSettings' })
  .sort({ createdAt: -1 });
```

## Security Features

### Authentication & Authorization
- All super admin endpoints require valid JWT token
- Role check enforced via `requireSuperAdmin` middleware
- Regular admins cannot access super admin endpoints (403 Forbidden)
- Unauthorized requests return 401

### Audit Trail
- All super admin actions are logged
- IP address tracked (proxy-aware via X-Forwarded-For)
- User agent recorded
- Request metadata captured
- Timestamp on all logs

### Input Validation
- Enum validation on `siteStatus` (only 'online' | 'maintenance')
- Max length validation on `maintenanceMessage` (500 chars)
- Boolean type validation on all flags

## Testing

### Manual Testing Script
Location: `backend/scripts/test-super-admin.sh`

```bash
# Generate super admin token
node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({id:'test',email:'super@test.com',role:'superadmin',name:'Test'},'YOUR_JWT_SECRET',{expiresIn:'1h'}))"

# Run tests
./backend/scripts/test-super-admin.sh <token>
```

### Unit Tests
Location: `backend/tests/super-admin.test.mjs`

Tests cover:
- Super admin access control
- Admin/user denial
- System settings CRUD
- Kill switch activation
- System restore
- Model schema validation
- Service exports

## Integration Points

### Use in Routes
```javascript
import { areBookingsEnabled } from '../services/featureFlagService.mjs';

router.post('/bookings', requireAuth(), async (req, res) => {
  if (!(await areBookingsEnabled())) {
    return res.apiError('Bookings are currently disabled', 503);
  }
  // Process booking...
});
```

### Use in Middleware
```javascript
export const checkMaintenanceMode = async (req, res, next) => {
  const { status, message } = await getSiteStatus();
  if (status === 'maintenance') {
    return res.apiError(message, 503);
  }
  next();
};
```

### Use in Controllers
```javascript
import { arePaymentsEnabled } from '../services/featureFlagService.mjs';

export const processPayment = async (req, res) => {
  if (!(await arePaymentsEnabled())) {
    return res.apiError('Payment processing is currently disabled', 503);
  }
  // Process payment...
};
```

## File Changes Summary

### New Files
1. `backend/services/featureFlagService.mjs` - Feature flag service
2. `backend/middlewares/auditLogger.mjs` - Audit logging middleware
3. `backend/routes/superAdminRoutes.mjs` - Super admin API routes
4. `backend/tests/super-admin.test.mjs` - Unit tests
5. `backend/scripts/test-super-admin.sh` - Manual test script
6. `docs/SUPER_ADMIN_IMPLEMENTATION.md` - This documentation

### Modified Files
1. `backend/models/GlobalSettings.mjs` - Added system control fields
2. `backend/models/AdminLog.mjs` - Added new action types and fields
3. `backend/server.mjs` - Registered super admin routes
4. `backend/config/sentry.mjs` - Fixed pre-existing import bug

### No Changes Required
- User model (already had 'superadmin' role)
- adminGuard.mjs (already had requireSuperAdmin middleware)
- Environment variables (no new env vars added)
- Authentication flow (reuses existing JWT system)

## API Reference

### Endpoints

#### GET /api/v1/super-admin/system-settings
Get current system settings

**Auth:** Super Admin only  
**Response:**
```json
{
  "success": true,
  "data": {
    "siteStatus": "online",
    "maintenanceMessage": "",
    "bookingEnabled": true,
    "paymentEnabled": true,
    "registrationsEnabled": true,
    "forceLogoutAll": false,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/v1/super-admin/system-settings
Update system settings

**Auth:** Super Admin only  
**Request Body:**
```json
{
  "siteStatus": "online",
  "maintenanceMessage": "Custom message",
  "bookingEnabled": true,
  "paymentEnabled": true,
  "registrationsEnabled": true,
  "forceLogoutAll": false
}
```

#### POST /api/v1/super-admin/kill-switch
Emergency kill switch

**Auth:** Super Admin only  
**Request Body:**
```json
{
  "message": "Emergency maintenance message",
  "reason": "Security incident"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "siteStatus": "maintenance",
    "bookingEnabled": false,
    "paymentEnabled": false,
    "maintenanceMessage": "Emergency maintenance message"
  }
}
```

#### POST /api/v1/super-admin/restore
Restore normal operations

**Auth:** Super Admin only  
**Response:**
```json
{
  "success": true,
  "data": {
    "siteStatus": "online",
    "bookingEnabled": true,
    "paymentEnabled": true
  }
}
```

## Migration Notes

### Upgrading
No database migration required. New fields will be created with defaults on first access.

### Backward Compatibility
- All changes are additive only
- Existing functionality unchanged
- No breaking changes to existing APIs
- Feature flags default to enabled state

### Creating First Super Admin
```javascript
// In MongoDB shell or admin script
db.users.updateOne(
  { email: 'admin@example.com' },
  { $set: { role: 'superadmin' } }
);
```

Or via API (as existing superadmin or through direct DB access):
```bash
curl -X PUT http://localhost:5000/api/v1/users/<user_id> \
  -H "Authorization: Bearer <superadmin_token>" \
  -d '{"role": "superadmin"}'
```

## Best Practices

1. **Limit Super Admins:** Only grant superadmin role to trusted personnel
2. **Monitor Audit Logs:** Regularly review AdminLog for unusual activity
3. **Test Kill Switch:** Periodically test kill switch in staging
4. **Document Changes:** Log reason when using kill switch
5. **Restore Promptly:** Don't leave system in maintenance mode longer than necessary

## Future Enhancements

Potential additions (not in scope for this phase):
- `forceLogoutAll` implementation (invalidate all JWT tokens)
- Scheduled maintenance windows
- Partial feature toggles (per-region, per-user)
- Kill switch notifications (email, Slack)
- Audit log retention policies
- Super admin 2FA requirement

## Support

For issues or questions:
1. Check audit logs: `db.adminlogs.find().sort({createdAt: -1})`
2. Verify system settings: `db.globalsettings.findOne({key: 'global'})`
3. Review server logs for errors
4. Contact development team
