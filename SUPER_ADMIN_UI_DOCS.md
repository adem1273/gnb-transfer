# Super Admin UI Documentation

## Overview

The Super Admin UI provides a comprehensive dashboard for system-wide controls and monitoring. This feature is accessible only to users with `admin` or `superadmin` roles.

## Features

### 1. System Settings Panel
- **Site Status Control**: Toggle between online and maintenance mode
- **Maintenance Message**: Custom message (max 500 characters) displayed during maintenance
- **Feature Toggles**: Enable/disable booking, payment, and user registrations
- **Validation**: Client-side validation for all inputs
- **Auto-save**: Settings persist immediately to backend

### 2. Kill Switch Panel
- **Emergency Kill Switch**: Immediately disable critical features
  - Sets site to maintenance mode
  - Disables bookings and payments
  - Displays custom maintenance message
- **Two-Step Confirmation**: Requires typing "ONAY" to activate
- **Restore Function**: One-click system restoration to normal operation
- **Audit Trail**: All actions are logged for compliance

### 3. Feature Flags Panel
- **Individual Feature Controls**:
  - Booking System toggle
  - Payment Processing toggle
  - User Registrations toggle
- **Optimistic UI**: Immediate visual feedback, reverts on error
- **Real-time Updates**: Changes take effect immediately

### 4. Audit Log Viewer
- **Comprehensive Logging**: View all admin actions
- **Advanced Filtering**:
  - Filter by action type
  - Filter by user ID
  - Date range filtering
- **Pagination**: Navigate through large log sets
- **CSV Export**: Download audit logs for compliance
- **Fallback Endpoints**: Automatically tries multiple API endpoints

## Access Control

### Route Protection
- **Path**: `/admin/super`
- **Required Roles**: `admin` or `superadmin`
- **Redirect**: Unauthorized users redirected to home page

### Sidebar Navigation
- Link visible only to admin users
- Highlighted in red for visibility
- Icon: ⚡ Super Admin

## API Integration

### Endpoints Used

1. **GET /api/v1/super-admin/system-settings**
   - Fetch current system settings
   - Used by all panels for initial state

2. **PUT /api/v1/super-admin/system-settings**
   - Update system settings
   - Supports partial updates
   - Validates all inputs

3. **POST /api/v1/super-admin/kill-switch**
   - Activate emergency kill switch
   - Requires `message` and `reason` in request body
   - Sets site to maintenance mode

4. **POST /api/v1/super-admin/restore**
   - Restore system to normal operation
   - Re-enables all features

5. **GET /api/admin/logs** (with fallback to /api/v1/admin/audit-logs)
   - Fetch audit logs with filtering
   - Supports pagination
   - Query params: action, userId, startDate, endDate, page, limit

## Component Architecture

```
src/pages/SuperAdmin.jsx
├── SystemSettingsPanel.jsx
├── KillSwitchPanel.jsx
├── FeatureFlagsPanel.jsx
└── AuditLogViewer.jsx
```

### SuperAdmin.jsx
Main container page with responsive grid layout:
- 2-column layout on large screens
- Single column on mobile
- Lazy loads all child components
- Implements role-based access control

### SystemSettingsPanel.jsx
Form-based settings management:
- Radio buttons for site status
- Textarea for maintenance message
- Checkboxes for feature toggles
- Real-time character counter
- Inline validation and error handling

### KillSwitchPanel.jsx
Emergency control interface:
- Current status indicator
- Conditional action buttons (activate/restore)
- Modal-based confirmation
- Required fields: confirmation text ("ONAY"), reason
- Optional: custom maintenance message

### FeatureFlagsPanel.jsx
Individual feature toggle interface:
- Toggle switches for each feature
- Optimistic UI updates
- Automatic error recovery
- Loading indicators per toggle

### AuditLogViewer.jsx
Log viewing and filtering interface:
- Filterable table view
- Export to CSV functionality
- Pagination controls
- Endpoint fallback logic

## User Experience

### Loading States
- Skeleton loaders during data fetch
- Per-component loading indicators
- Disabled buttons during processing

### Error Handling
- Inline error messages
- Toast-style success notifications
- Auto-dismiss after 3-5 seconds
- Detailed error messages from API

### Responsive Design
- Mobile-first approach
- Grid layout adapts to screen size
- Touch-friendly controls
- Optimized for tablets and desktops

## Security Features

### Input Validation
- Maximum length enforcement (500 chars for maintenance message)
- Type checking for boolean fields
- Required field validation
- Enum validation for site status

### Confirmation Steps
- Two-step confirmation for kill switch
- Window.confirm for system restore
- Clear warning messages

### Audit Trail
- All actions logged to backend
- User identification in logs
- Timestamp and IP address tracking
- Action type categorization

## Testing Checklist

### Functional Testing
- [ ] Login as admin user
- [ ] Access /admin/super route
- [ ] Verify unauthorized users are redirected
- [ ] Update site status (online/maintenance)
- [ ] Update maintenance message
- [ ] Toggle feature flags
- [ ] Activate kill switch with "ONAY" confirmation
- [ ] Restore system after kill switch
- [ ] Filter audit logs by action
- [ ] Filter audit logs by date range
- [ ] Export audit logs to CSV
- [ ] Verify pagination in audit logs

### UI/UX Testing
- [ ] Test on mobile device (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1920px width)
- [ ] Verify loading states appear
- [ ] Verify error messages display correctly
- [ ] Verify success messages auto-dismiss
- [ ] Test optimistic UI in feature flags
- [ ] Verify modal overlay and keyboard focus

### Error Handling Testing
- [ ] Test with backend offline
- [ ] Test with invalid authentication
- [ ] Test with network timeout
- [ ] Test with malformed API responses
- [ ] Test validation errors (message > 500 chars)
- [ ] Test kill switch without confirmation text
- [ ] Test kill switch without reason

## Performance Optimizations

### Code Splitting
- Lazy loading of all components
- Suspense boundaries for loading states
- Separate chunks per component

### API Optimization
- Single endpoint calls per panel
- Efficient state management
- Debounced filter updates
- Pagination for large datasets

### Bundle Size
Component sizes (gzipped):
- FeatureFlagsPanel: ~1.42 KB
- SystemSettingsPanel: ~1.57 KB
- KillSwitchPanel: ~1.84 KB
- AuditLogViewer: ~2.44 KB

## Troubleshooting

### Common Issues

**Issue**: "Audit log endpoint not available"
- **Solution**: Verify backend audit log API is running
- Check `/api/admin/logs` endpoint
- Ensure proper authentication headers

**Issue**: Kill switch modal doesn't close
- **Solution**: Click "Cancel" button or update confirmation text
- Check browser console for errors

**Issue**: Feature flags revert after toggle
- **Solution**: Check network tab for failed API calls
- Verify backend is accepting PUT requests
- Check user permissions (superadmin required)

**Issue**: CSV export is empty
- **Solution**: Ensure logs are loaded before exporting
- Check pagination - export only exports current page

## Future Enhancements

### Planned Features
1. Real-time notifications via WebSockets
2. Advanced audit log search (full-text)
3. Scheduled maintenance windows
4. Multiple admin notifications before kill switch
5. Rollback functionality for settings changes
6. A/B testing toggle for features
7. Usage analytics per feature flag
8. Automated alerts for suspicious activities

### Potential Improvements
- Dark mode support
- Keyboard shortcuts for quick actions
- Bulk operations for audit logs
- Advanced CSV export options (date range, custom fields)
- Settings version history
- Automated backup before kill switch

## Compliance & Governance

### Audit Requirements
- All admin actions are logged
- Logs include user ID, timestamp, IP, and action
- Logs are immutable (no delete functionality)
- CSV export for compliance reporting

### Security Best Practices
- Role-based access control (RBAC)
- Two-factor authentication recommended (not in scope)
- Rate limiting on backend endpoints
- Input sanitization and validation
- HTTPS required in production

## Deployment Notes

### Environment Variables
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Backend Requirements
- Super admin routes must be deployed
- Authentication middleware configured
- Audit logging enabled
- CORS configured for frontend domain

### Build & Deploy
```bash
# Build frontend
npm run build

# Deploy to CDN/hosting
# Ensure API_URL is set correctly
```

## Support

For issues or questions:
1. Check this documentation
2. Review backend API documentation
3. Check browser console for errors
4. Review network tab for API failures
5. Contact system administrator

## License

This feature is part of the GNB Transfer application.
© 2024 GNB Transfer. All rights reserved.
