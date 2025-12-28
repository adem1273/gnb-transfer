# Super Admin Quick Reference

## Quick Start

### 1. Create First Super Admin
```javascript
// MongoDB shell
db.users.updateOne(
  { email: 'your-email@example.com' },
  { $set: { role: 'superadmin' } }
);
```

### 2. Generate JWT Token
```bash
# Using existing auth endpoint
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### 3. Test Endpoints
```bash
TOKEN="your_jwt_token_here"

# Get system settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/super-admin/system-settings

# Update settings
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookingEnabled":true}' \
  http://localhost:5000/api/v1/super-admin/system-settings

# Activate kill switch
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Emergency maintenance","reason":"Test"}' \
  http://localhost:5000/api/v1/super-admin/kill-switch

# Restore system
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/super-admin/restore
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/super-admin/system-settings` | Get system settings | Super Admin |
| PUT | `/api/v1/super-admin/system-settings` | Update system settings | Super Admin |
| POST | `/api/v1/super-admin/kill-switch` | Emergency shutdown | Super Admin |
| POST | `/api/v1/super-admin/restore` | Restore operations | Super Admin |

## System Settings Fields

```javascript
{
  siteStatus: 'online' | 'maintenance',
  maintenanceMessage: string (max 500 chars),
  bookingEnabled: boolean,
  paymentEnabled: boolean,
  registrationsEnabled: boolean,
  forceLogoutAll: boolean (future use)
}
```

## Feature Flag Service

```javascript
import {
  areBookingsEnabled,
  arePaymentsEnabled,
  areRegistrationsEnabled,
  getSiteStatus
} from './services/featureFlagService.mjs';

// Check if bookings enabled
if (!(await areBookingsEnabled())) {
  return res.apiError('Bookings disabled', 503);
}

// Check site status
const { status, message } = await getSiteStatus();
if (status === 'maintenance') {
  return res.apiError(message, 503);
}
```

## Audit Logging

```javascript
import { logAdminAction } from './middlewares/auditLogger.mjs';

// Apply to route
router.post('/action',
  requireAuth(),
  requireSuperAdmin,
  logAdminAction('ACTION_NAME', 'TargetType'),
  handler
);

// Query logs
const logs = await AdminLog.find({
  action: 'KILL_SWITCH_ACTIVATED'
}).sort({ createdAt: -1 });
```

## Security Checklist

- [ ] Grant superadmin role only to trusted personnel
- [ ] Use strong passwords for super admin accounts
- [ ] Monitor AdminLog regularly for suspicious activity
- [ ] Test kill switch in staging before using in production
- [ ] Document reason when activating kill switch
- [ ] Restore system promptly after emergency

## Common Tasks

### Emergency Shutdown
```bash
# 1. Activate kill switch
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Security incident - investigating","reason":"Potential breach detected"}' \
  http://localhost:5000/api/v1/super-admin/kill-switch

# 2. Investigate issue

# 3. Restore when ready
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/super-admin/restore
```

### Disable Specific Feature
```bash
# Disable only bookings
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -d '{"bookingEnabled":false}' \
  http://localhost:5000/api/v1/super-admin/system-settings

# Disable only payments
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -d '{"paymentEnabled":false}' \
  http://localhost:5000/api/v1/super-admin/system-settings
```

### Maintenance Mode
```bash
# Enter maintenance
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -d '{"siteStatus":"maintenance","maintenanceMessage":"Scheduled maintenance - back at 3pm"}' \
  http://localhost:5000/api/v1/super-admin/system-settings

# Exit maintenance
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -d '{"siteStatus":"online","maintenanceMessage":""}' \
  http://localhost:5000/api/v1/super-admin/system-settings
```

## Troubleshooting

### 403 Forbidden
- Verify user has 'superadmin' role in database
- Check JWT token is valid and not expired
- Ensure using correct endpoint path

### 401 Unauthorized
- Check Authorization header format: `Bearer <token>`
- Verify JWT_SECRET matches server configuration
- Generate new token if expired

### System Not Responding After Kill Switch
- Check database: `db.globalsettings.findOne({key:'global'})`
- Verify siteStatus and flags
- Use restore endpoint or manually update DB
- Review server logs for errors

## MongoDB Queries

```javascript
// View current settings
db.globalsettings.findOne({key: 'global'});

// View recent super admin actions
db.adminlogs.find({
  action: {$in: ['SUPER_ADMIN_ACTION', 'KILL_SWITCH_ACTIVATED', 'SYSTEM_SETTINGS_UPDATE']}
}).sort({createdAt: -1}).limit(20);

// View actions by specific user
db.adminlogs.find({'user.email': 'admin@example.com'}).sort({createdAt: -1});

// Manually restore if needed
db.globalsettings.updateOne(
  {key: 'global'},
  {$set: {
    siteStatus: 'online',
    bookingEnabled: true,
    paymentEnabled: true
  }}
);
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | N/A |
| 401 | Unauthorized | Check token |
| 403 | Forbidden | Verify superadmin role |
| 500 | Server Error | Check logs |
| 503 | Service Unavailable | Feature disabled or maintenance mode |
