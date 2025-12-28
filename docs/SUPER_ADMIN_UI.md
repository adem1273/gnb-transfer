# Super Admin UI - User Guide

## Overview

The Super Admin UI provides comprehensive system-wide controls and monitoring capabilities for administrators with `admin` or `superadmin` roles. This guide covers how to access, use, and test the Super Admin features.

## Table of Contents

1. [Access and Authentication](#access-and-authentication)
2. [Features Overview](#features-overview)
3. [Local Development Setup](#local-development-setup)
4. [Testing Guide](#testing-guide)
5. [API Endpoints](#api-endpoints)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

## Access and Authentication

### Route Protection

- **URL**: `/admin/super`
- **Required Roles**: `admin` or `superadmin`
- **Protection**: Route is protected via `PrivateRoute` component
- **Unauthorized Access**: Users without proper permissions are redirected to the home page

### Accessing the Super Admin Dashboard

1. Log in with admin or superadmin credentials
2. Navigate to `/admin/super` or access via the admin sidebar
3. The dashboard will display if you have the required permissions

### Generating a Super Admin Token (Development)

For local testing, you can create a super admin user:

```bash
cd backend
node scripts/createSuperAdmin.js
```

Or use MongoDB directly:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "superadmin" } }
);
```

## Features Overview

### 1. System Settings Panel

**Purpose**: Control global system configuration and feature availability

**Features**:
- **Site Status**: Toggle between "Online" and "Maintenance" modes
- **Maintenance Message**: Custom message displayed during maintenance (max 500 characters)
- **Feature Toggles**: Enable/disable critical features
  - Booking System
  - Payment Processing
  - User Registrations

**Validation**:
- Client-side validation for message length (500 character limit)
- Character counter displays current usage
- All inputs have proper labels and ARIA attributes

**Usage**:
1. Modify the desired settings
2. Click "Save Settings" to persist changes
3. Success message confirms the update
4. Changes are logged in the audit trail

### 2. Kill Switch Panel

**Purpose**: Emergency system shutdown capability with two-step confirmation

**Features**:
- **Activate Kill Switch**: Immediately disables critical features
  - Sets site to maintenance mode
  - Disables bookings and payments
  - Displays custom maintenance message
- **Restore System**: Returns system to normal operation
- **Two-Step Confirmation**: Requires typing "ONAY" to activate

**Usage - Activating Kill Switch**:
1. Click "🚨 Activate Kill Switch" button
2. Modal opens with confirmation form
3. Enter maintenance message (optional, default provided)
4. Enter reason for activation (required)
5. Type "ONAY" in the confirmation field
6. Click "Confirm" to activate

**Usage - Restoring System**:
1. Click "✅ Restore System" button
2. Confirm the action in the browser dialog
3. System returns to normal operation

**Security Notes**:
- All kill switch activations are logged with reason and admin details
- Session validation recommended before critical actions
- Confirmation text must match exactly (case-sensitive)

### 3. Feature Flags Panel

**Purpose**: Individual feature toggle controls with optimistic UI updates

**Features**:
- **Booking System Toggle**: Enable/disable new bookings
- **Payment Processing Toggle**: Enable/disable payment transactions
- **User Registrations Toggle**: Enable/disable new user sign-ups

**UI Behavior**:
- **Optimistic Updates**: UI updates immediately before server confirmation
- **Auto-Revert**: Reverts to previous state if API call fails
- **Loading Indicators**: Spinner shows during API request
- **Persistent State**: Changes persist across page refreshes

**Usage**:
1. Click any toggle switch to enable/disable feature
2. UI updates immediately
3. Server confirms change in background
4. Error message displays if update fails

### 4. Audit Log Viewer

**Purpose**: View and filter system audit logs with export capability

**Features**:
- **Comprehensive Logging**: All admin actions recorded
- **Advanced Filtering**:
  - Filter by action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
  - Filter by user ID
  - Filter by date range (from/to dates)
- **Pagination**: Navigate through large log sets (20 logs per page)
- **CSV Export**: Download audit logs for compliance and analysis
- **Fallback Endpoints**: Automatically tries multiple API endpoints

**Usage - Viewing Logs**:
1. Logs load automatically on page access
2. Use filter dropdowns and inputs to refine results
3. Navigate pages using "Previous" and "Next" buttons

**Usage - Exporting Logs**:
1. Apply desired filters
2. Click "📥 Export CSV" button
3. CSV file downloads with visible logs
4. File includes: Timestamp, Action, User, Target, IP, Method, Endpoint

**Log Data Handling**:
- Sensitive data (passwords, tokens) is masked before rendering
- Large datasets support pagination (default 20 per page)
- Date/time displayed in local timezone

## Local Development Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally or connection string
- npm or yarn package manager

### Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   
   Create `.env` file in backend directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/gnb-transfer
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

   Create `.env` file in root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend** (in separate terminal):
   ```bash
   npm run dev
   ```

5. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - Super Admin: http://localhost:5173/admin/super

### Creating Test Users

```javascript
// Using MongoDB shell or Compass
db.users.insertOne({
  name: "Super Admin",
  email: "superadmin@test.com",
  password: "$2a$10$...", // bcrypt hash of password
  role: "superadmin",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Testing Guide

### Running Tests

**All Tests**:
```bash
npm test
```

**Watch Mode**:
```bash
npm run test:watch
```

**Coverage Report**:
```bash
npm run test:coverage
```

**Specific Test File**:
```bash
npm test -- SystemSettingsPanel.test.jsx
```

### Test Files Location

- `src/components/superadmin/__tests__/SystemSettingsPanel.test.jsx`
- `src/components/superadmin/__tests__/KillSwitchPanel.test.jsx`
- `src/components/superadmin/__tests__/FeatureFlagsPanel.test.jsx`
- `src/components/superadmin/__tests__/AuditLogViewer.test.jsx`
- `src/pages/__tests__/SuperAdmin.page.test.jsx`

### Test Coverage Goals

- **Target**: 80%+ coverage for new files
- **Focus Areas**:
  - Component rendering
  - User interactions
  - API integration
  - Error handling
  - Accessibility (ARIA attributes)
  - Form validation

### Manual Testing Flows

**Test Flow 1: System Settings Update**
1. Navigate to `/admin/super`
2. Change site status to "Maintenance"
3. Enter maintenance message
4. Toggle feature flags
5. Click "Save Settings"
6. Verify success message appears
7. Refresh page - settings should persist

**Test Flow 2: Kill Switch Activation**
1. Navigate to `/admin/super`
2. Click "Activate Kill Switch"
3. Enter reason (e.g., "Security test")
4. Type "ONAY" in confirmation field
5. Click "Confirm"
6. Verify success message
7. Check site is in maintenance mode
8. Click "Restore System" to revert

**Test Flow 3: Feature Toggles**
1. Navigate to `/admin/super`
2. Toggle "Booking System" off
3. Verify optimistic UI update
4. Check toggle reflects change
5. Toggle back on
6. Verify changes persist

**Test Flow 4: Audit Logs**
1. Navigate to `/admin/super`
2. Scroll to Audit Logs section
3. Apply filter: Action = "SYSTEM_SETTINGS_UPDATE"
4. Verify filtered results
5. Click "Export CSV"
6. Verify CSV file downloads
7. Check CSV contains expected data

## API Endpoints

### GET /api/v1/super-admin/system-settings

**Description**: Retrieve current system settings

**Authentication**: Required (JWT token)

**Authorization**: Admin or Super Admin role

**Response**:
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
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/v1/super-admin/system-settings

**Description**: Update system settings

**Authentication**: Required (JWT token)

**Authorization**: Admin or Super Admin role

**Request Body**:
```json
{
  "siteStatus": "maintenance",
  "maintenanceMessage": "Scheduled maintenance",
  "bookingEnabled": false,
  "paymentEnabled": false,
  "registrationsEnabled": true
}
```

**Response**: Same as GET endpoint

**Validation**:
- `siteStatus`: Must be "online" or "maintenance"
- `maintenanceMessage`: Max 500 characters
- Boolean fields must be true/false

### POST /api/v1/super-admin/kill-switch

**Description**: Emergency kill switch - disable critical features

**Authentication**: Required (JWT token)

**Authorization**: Admin or Super Admin role

**Request Body**:
```json
{
  "message": "Emergency maintenance message",
  "reason": "Security breach detected"
}
```

**Response**:
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

### POST /api/v1/super-admin/restore

**Description**: Restore system to normal operation

**Authentication**: Required (JWT token)

**Authorization**: Admin or Super Admin role

**Request Body**: `{}`

**Response**:
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

### GET /admin/logs

**Description**: Retrieve audit logs with filtering

**Authentication**: Required (JWT token)

**Authorization**: Admin or Super Admin role

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `action`: Filter by action type
- `userId`: Filter by user ID
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter to date (ISO 8601)

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "...",
        "createdAt": "2024-01-15T10:30:00Z",
        "action": "SYSTEM_SETTINGS_UPDATE",
        "user": {
          "email": "admin@test.com",
          "name": "Admin User"
        },
        "target": {
          "type": "SystemSettings",
          "name": "Global Settings"
        },
        "ipAddress": "192.168.1.1",
        "method": "PUT",
        "endpoint": "/api/v1/super-admin/system-settings"
      }
    ],
    "pagination": {
      "total": 50,
      "pages": 3
    }
  }
}
```

## Security Considerations

### Deep Link Protection

- Route `/admin/super` is protected via `PrivateRoute` component
- Unauthorized users redirected to home page
- Not just hidden from sidebar - actual route protection

### Session Validation

- Recommend re-validating session before critical POST actions
- Especially important for kill switch activation
- Idle timeout should trigger re-authentication

### Audit Log Integrity

- Sensitive data (passwords, tokens, credit cards) masked in UI
- Backend should redact sensitive fields before logging
- Logs include: timestamp, action, user, IP, endpoint

### Best Practices

1. **Always provide reason** when activating kill switch
2. **Review audit logs regularly** for suspicious activity
3. **Test kill switch** in staging before production use
4. **Document all maintenance** windows and reasons
5. **Limit super admin access** to trusted personnel only

### CSRF Protection

- All state-changing requests use POST/PUT
- Include CSRF token in headers if configured
- API validates request origin

## Troubleshooting

### Issue: Cannot Access Super Admin Dashboard

**Symptoms**: Redirected to home page when accessing `/admin/super`

**Solutions**:
1. Verify user role is `admin` or `superadmin`
2. Check JWT token is valid and not expired
3. Ensure authentication middleware is working
4. Check browser console for errors

### Issue: Settings Not Saving

**Symptoms**: Click "Save Settings" but no success message

**Solutions**:
1. Check network tab for API errors
2. Verify backend is running
3. Check MongoDB connection
4. Review backend logs for validation errors
5. Ensure request payload is valid JSON

### Issue: Kill Switch Modal Won't Confirm

**Symptoms**: Confirm button stays disabled

**Solutions**:
1. Ensure "ONAY" is typed exactly (case-sensitive)
2. Verify reason field is not empty
3. Check for JavaScript errors in console

### Issue: Audit Logs Not Loading

**Symptoms**: "Endpoint not available" message

**Solutions**:
1. Verify `/admin/logs` or `/v1/admin/audit-logs` endpoint exists
2. Check backend routes are properly registered
3. Ensure audit logging middleware is configured
4. Check database for AuditLog collection

### Issue: Feature Toggle Not Updating

**Symptoms**: Toggle reverts to previous state

**Solutions**:
1. Check network errors in browser console
2. Verify PUT endpoint is accessible
3. Check backend validation rules
4. Review API response for error messages

### Issue: CSV Export Not Working

**Symptoms**: Click export but no download

**Solutions**:
1. Check browser download permissions
2. Verify logs exist (export is disabled when empty)
3. Check browser console for JavaScript errors
4. Try different browser

## Additional Resources

- **Backend Implementation**: `backend/routes/superAdminRoutes.mjs`
- **Frontend Components**: `src/components/superadmin/`
- **Test Files**: `src/components/superadmin/__tests__/`
- **Authentication**: `src/context/AuthContext.jsx`
- **API Utilities**: `src/utils/api.js`

## Support

For issues or questions:
1. Check this documentation first
2. Review test files for usage examples
3. Check backend logs for API errors
4. Review GitHub issues for similar problems
5. Contact development team

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: GNB Transfer Development Team
