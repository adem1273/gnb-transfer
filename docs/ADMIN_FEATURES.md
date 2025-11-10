# Admin Panel Upgrade - Features Documentation

This document describes the new professional admin panel features added to GNB Transfer. All features use free, open-source, or self-hosted tools.

## Table of Contents

1. [Module Management System](#1-module-management-system)
2. [Dynamic Campaign Rule Engine](#2-dynamic-campaign-rule-engine)
3. [AI-Based Admin Insights](#3-ai-based-admin-insights)
4. [Automated Notification System](#4-automated-notification-system)
5. [Reservation Calendar View](#5-reservation-calendar-view)
6. [Multi-Role Access Control](#6-multi-role-access-control)
7. [Action Logging System](#7-action-logging-system)

---

## 1. Module Management System

**Purpose:** Enable or disable major system modules without editing code.

### Features
- Toggle modules: Tours, Users, Bookings, Payments
- Admin-only access (role: admin)
- Automatic route protection via middleware
- Real-time module status updates

### Backend
- **Model:** `AdminSettings.mjs` - Stores module activation state
- **Middleware:** `moduleGuard.mjs` - Checks module status before route execution
- **Routes:** 
  - `GET /api/admin/settings` - Get current settings
  - `PATCH /api/admin/settings` - Update settings

### Frontend
- **Page:** `/admin/modules` - ModuleManagement.jsx
- **Features:**
  - Toggle switches for each module
  - Descriptive text for each module
  - Save button with loading state
  - Success/error notifications

### Usage
1. Navigate to Admin Panel → Modules
2. Toggle any module on/off
3. Click "Save Changes"
4. Disabled modules return 503 when accessed via API

---

## 2. Dynamic Campaign Rule Engine

**Purpose:** Automate discounts based on rules (date, city, tour type).

### Features
- Condition types: City, Tour Type, Day of Week, Date, Booking Count
- Discount rate: 0-100%
- Start/End date scheduling
- Active/Inactive toggle
- Manual and automatic application
- Applied count tracking

### Backend
- **Model:** `CampaignRule.mjs` - Campaign rule definitions
- **Service:** `campaignScheduler.mjs` - Scheduled task using node-cron
- **Routes:**
  - `GET /api/admin/campaigns` - List all campaigns
  - `POST /api/admin/campaigns` - Create campaign
  - `PATCH /api/admin/campaigns/:id` - Update campaign
  - `DELETE /api/admin/campaigns/:id` - Delete campaign
  - `POST /api/admin/campaigns/apply` - Manually apply campaigns

### Frontend
- **Page:** `/admin/campaigns` - CampaignRules.jsx
- **Features:**
  - Create/Edit campaign form
  - List view with filtering
  - Status indicators (Active/Inactive)
  - Manual apply button
  - Delete with confirmation

### Scheduler
- Runs every hour (cron: `0 * * * *`)
- Finds active campaigns within date range
- Updates tour prices based on rules
- Tracks application count

### Usage
1. Navigate to Admin Panel → Campaigns
2. Click "Create New Campaign"
3. Fill form with condition, target, discount, dates
4. Save and activate
5. Scheduler applies rules automatically every hour
6. Or click "Apply Campaigns Now" for immediate execution

---

## 3. AI-Based Admin Insights

**Purpose:** Statistical analysis without paid AI APIs.

### Features
- Key metrics: Total bookings, revenue, avg booking value, users
- Most popular tour identification
- Revenue trend (last 7 days)
- Bookings trend chart
- AI-generated suggestions
- Date range filtering

### Backend
- **Routes:** `GET /api/admin/insights`
- **Logic:** Pure JavaScript analysis (no external AI)
- **Data Sources:** Bookings, Tours, Users collections

### Frontend
- **Page:** `/admin/insights` - AIInsights.jsx
- **Features:**
  - 4 metric cards (gradient backgrounds)
  - Most popular tour highlight
  - Line chart for revenue trend (Recharts)
  - Bar chart for bookings trend (Recharts)
  - AI suggestions list
  - Date range filter

### Metrics Calculated
- Total bookings and revenue
- Average booking value
- Most booked tour
- Daily revenue/booking trends (7 days)

### AI Suggestions Logic
- Revenue threshold analysis
- Popular tour recommendations
- User-to-booking conversion analysis

### Usage
1. Navigate to Admin Panel → AI Insights
2. View dashboard with metrics and charts
3. Optionally filter by date range
4. Review AI suggestions

---

## 4. Automated Notification System

**Purpose:** Send confirmation emails for bookings, payments, and campaigns.

### Features
- Email providers: Gmail, Mailtrap, Generic SMTP
- Notification types: Booking confirmation, Payment received, Campaign started, System alerts
- Toggle notifications on/off
- Configurable sender email and name
- Template-based emails

### Backend
- **Model:** `AdminSettings.mjs` - Notification preferences
- **Service:** `emailService.mjs` - Nodemailer integration
- **Functions:**
  - `sendEmail()` - Generic email sender
  - `sendBookingConfirmation()`
  - `sendPaymentConfirmation()`
  - `sendCampaignNotification()`
  - `shouldSendNotification()` - Check settings

### Frontend
- **Page:** `/admin/notifications` - NotificationSettings.jsx
- **Features:**
  - Email configuration (from email, from name)
  - Toggle switches for each notification type
  - Setup instructions for SMTP
  - Save button

### Email Providers

#### Gmail (Free)
```env
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Mailtrap (Free - Testing)
```env
EMAIL_PROVIDER=mailtrap
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-username
MAILTRAP_PASSWORD=your-password
```

### Usage
1. Configure SMTP in backend .env file
2. Navigate to Admin Panel → Notifications
3. Set sender email and name
4. Toggle desired notification types
5. Save changes
6. Emails sent automatically on events

---

## 5. Reservation Calendar View

**Purpose:** Visual calendar display of all bookings.

### Features
- Monthly calendar view
- Color-coded bookings by status
  - Green: Confirmed
  - Yellow: Pending
  - Red: Cancelled
- Booking count per day
- Click date to view details
- Modal with booking information
- Statistics sidebar

### Backend
- **Routes:** `GET /api/bookings/calendar`
- **Response:** Array of calendar events with color, title, date

### Frontend
- **Page:** `/admin/calendar` - CalendarView.jsx
- **Library:** react-calendar (free)
- **Features:**
  - Interactive calendar
  - Tile styling based on bookings
  - Modal with daily bookings
  - Legend and statistics

### Usage
1. Navigate to Admin Panel → Calendar View
2. View monthly calendar with colored dates
3. Click date to see bookings
4. Modal shows all bookings for that day
5. Check statistics in sidebar

---

## 6. Multi-Role Access Control

**Purpose:** Different access levels for Super Admin, Manager, and Support.

### Roles
- **admin:** Full access to all features
- **manager:** Access to most features except critical settings
- **support:** Limited access (future implementation)
- **user:** Regular customer (no admin access)
- **driver:** Driver panel access

### Backend
- **Model:** `User.mjs` - Extended role field
- **Middleware:** `auth.mjs` - Role-based route protection
- **Usage:** `requireAuth(['admin', 'manager'])`

### Frontend
- **Component:** `Sidebar.jsx` - Role-based menu rendering
- **Logic:**
  - Admin: All menu items
  - Manager: Limited to operations, no settings
  - Support: Future implementation

### Protected Features
- **Admin Only:**
  - Module Management
  - Notification Settings
  - Activity Logs
  
- **Admin & Manager:**
  - Dashboard
  - Bookings
  - Calendar View
  - AI Insights
  - Campaigns

### Usage
1. Create user with role via database or API
2. User sees only permitted menu items
3. API rejects unauthorized requests with 403

---

## 7. Action Logging System

**Purpose:** Track all admin actions for audit and compliance.

### Features
- Log types: CREATE, UPDATE, DELETE, LOGIN, SETTINGS_CHANGE, etc.
- User information: ID, email, name, role
- Target information: Type, ID, name
- Metadata: Request details
- IP address and user agent tracking
- Search and filter capabilities
- CSV export

### Backend
- **Model:** `AdminLog.mjs` - Log entries
- **Middleware:** `adminLogger.mjs` - Automatic logging
- **Routes:**
  - `GET /api/admin/logs` - List logs with filtering
  - `GET /api/admin/logs/export` - Export CSV

### Frontend
- **Page:** `/admin/logs` - ActivityLogs.jsx
- **Features:**
  - Filterable table (action, target type, date range)
  - Pagination (50 logs per page)
  - Color-coded action badges
  - CSV export button
  - User and target details

### Log Actions
- CREATE, UPDATE, DELETE (CRUD operations)
- LOGIN, LOGOUT (Authentication)
- VIEW, EXPORT (Read operations)
- SETTINGS_CHANGE (Configuration)
- CAMPAIGN_CREATE, CAMPAIGN_UPDATE, CAMPAIGN_DELETE (Campaign management)

### Usage
1. Navigate to Admin Panel → Activity Logs
2. View recent admin actions
3. Use filters to narrow results
4. Export to CSV for external analysis
5. Review user, action, target, and timestamp

---

## Deployment on Free Tier

### Requirements
- **Frontend:** Vercel (Free)
- **Backend:** Render Free Tier or Railway (500 hrs/month)
- **Database:** MongoDB Atlas Free Tier (512 MB)
- **Email:** Gmail (free with app password) or Mailtrap (500 emails/month)
- **Cron Jobs:** node-cron (runs in-process, no external service needed)

### Environment Variables

#### Backend (.env)
```env
# Database
MONGO_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key

# Email (choose one)
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

### Deployment Steps

1. **Deploy Backend to Render:**
   - Connect GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Add environment variables
   
2. **Deploy Frontend to Vercel:**
   - Connect GitHub repository
   - Build command: `npm run build`
   - Output directory: `dist`
   - Add environment variables

3. **Setup MongoDB Atlas:**
   - Create free cluster
   - Add IP whitelist: 0.0.0.0/0 (allow all)
   - Get connection string
   - Add to backend environment

4. **Configure Email (Optional):**
   - Gmail: Enable 2FA, create App Password
   - Or use Mailtrap for testing
   - Add credentials to backend environment

---

## Testing

### Module Management
1. Disable "tours" module
2. Try accessing `/api/tours` → should return 503
3. Re-enable module
4. Access should work again

### Campaigns
1. Create campaign: City = "Istanbul", Discount = 20%
2. Click "Apply Campaigns Now"
3. Check tours with location containing "Istanbul"
4. Prices should be reduced by 20%

### Notifications
1. Configure email in backend .env
2. Enable "Booking Confirmation" in Notifications settings
3. Create a test booking
4. Check email inbox for confirmation

### Calendar
1. Create bookings with different dates
2. Navigate to Calendar View
3. Dates with bookings should be colored
4. Click date to view details

### Logs
1. Perform any admin action (create, update, delete)
2. Navigate to Activity Logs
3. Should see logged action with timestamp
4. Export CSV and verify content

---

## Security Considerations

1. **Authentication:** All admin routes require JWT token
2. **Authorization:** Role-based access control enforced
3. **Logging:** All admin actions tracked for audit
4. **Input Validation:** All endpoints validate input
5. **Rate Limiting:** API endpoints rate-limited
6. **Email Security:** SMTP credentials stored in environment variables
7. **Module Guard:** Fail-open on errors (availability over strict control)

---

## Future Enhancements

1. Real-time notifications using WebSockets
2. Advanced analytics with custom date ranges
3. Multi-language support for emails
4. More campaign condition types
5. Support role implementation with limited permissions
6. Scheduled report generation and email delivery
7. Dashboard widgets customization
8. API usage analytics
9. Advanced filtering and search in logs
10. Backup and restore functionality

---

## Troubleshooting

### Emails Not Sending
- Check EMAIL_PROVIDER is set correctly
- Verify SMTP credentials in .env
- For Gmail, ensure App Password is used (not regular password)
- Check logs for email service errors

### Campaigns Not Applying
- Verify campaign is active and within date range
- Check scheduler logs in backend console
- Manually trigger with "Apply Campaigns Now" button
- Ensure tours match campaign conditions

### Module Guard Not Working
- Clear module cache: restart backend server
- Check AdminSettings exists in database
- Verify middleware is applied to routes

### Calendar Not Showing Bookings
- Ensure bookings have bookingDate field
- Check /api/bookings/calendar endpoint returns data
- Verify admin/manager role for access

---

## Support

For issues or questions:
1. Check backend logs for errors
2. Review browser console for frontend errors
3. Verify environment variables are set correctly
4. Test API endpoints with Postman/curl
5. Check MongoDB Atlas for data integrity

---

## Conclusion

This admin panel upgrade provides professional-level management features using entirely free and open-source technologies. All features are production-ready and can be deployed on free-tier hosting services.
