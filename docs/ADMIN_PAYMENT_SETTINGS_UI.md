# Admin Payment Provider Settings UI (Future Implementation)

This document provides a reference design for implementing payment provider configuration in the admin panel.

## Overview

The admin panel should allow Super Admin users to:
- Enable/disable payment providers (Stripe, PayTR)
- Configure test mode for PayTR
- View current payment provider status
- Set default payment provider

## API Endpoints

The following endpoints are already available in the backend:

### Get Global Settings (including payment providers)

```http
GET /api/admin/global-settings
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "key": "global",
    "siteName": "GNB Transfer",
    "paymentEnabled": true,
    "paymentProviders": {
      "stripe": {
        "enabled": true,
        "publicKey": ""
      },
      "paytr": {
        "enabled": false,
        "testMode": true
      }
    },
    "featureFlags": {...},
    ...
  }
}
```

### Update Payment Provider Settings

```http
PUT /api/admin/global-settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "paymentProviders": {
    "stripe": {
      "enabled": true,
      "publicKey": "pk_test_..."
    },
    "paytr": {
      "enabled": true,
      "testMode": false
    }
  }
}
```

## UI Component Design

### Location
- Admin Panel → Settings → Payment Settings
- Route: `/admin/settings/payments`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Payment Provider Settings                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Stripe ──────────────────────────────────────────────┐   │
│ │                                                        │   │
│ │  Status: ⚪ Enabled                                    │   │
│ │                                                        │   │
│ │  Configuration:                                        │   │
│ │  • Detected from STRIPE_SECRET_KEY environment var    │   │
│ │  • Public Key: pk_live_****************************    │   │
│ │                                                        │   │
│ │  Features:                                             │   │
│ │  ✅ Global card support                                │   │
│ │  ✅ 3D Secure authentication                           │   │
│ │  ✅ 135+ currencies                                    │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─ PayTR ───────────────────────────────────────────────┐   │
│ │                                                        │   │
│ │  Status: ⚪ Enabled     Test Mode: ⚪ Enabled          │   │
│ │                                                        │   │
│ │  Configuration:                                        │   │
│ │  • Merchant ID: 123456                                │   │
│ │  • Configured in environment variables                │   │
│ │                                                        │   │
│ │  Features:                                             │   │
│ │  ✅ Turkish card support                               │   │
│ │  ✅ Installment payments (up to 12 months)            │   │
│ │  ✅ 3D Secure authentication                           │   │
│ │  ✅ Troy, Visa, Mastercard                            │   │
│ │                                                        │   │
│ │  Test Mode Instructions:                              │   │
│ │  When enabled, use test cards from PayTR docs         │   │
│ │  Test Card: 4355084355084358 (12/30, CVV: 000)       │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│                                          [Save Changes]      │
└─────────────────────────────────────────────────────────────┘
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API from '../../../utils/api';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

function PaymentSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  
  // Fetch current settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get('/admin/global-settings');
        if (response.data?.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load payment settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle toggle changes
  const handleToggle = (provider, field) => {
    setSettings(prev => ({
      ...prev,
      paymentProviders: {
        ...prev.paymentProviders,
        [provider]: {
          ...prev.paymentProviders[provider],
          [field]: !prev.paymentProviders[provider][field]
        }
      }
    }));
  };
  
  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await API.put('/admin/global-settings', {
        paymentProviders: settings.paymentProviders
      });
      
      if (response.data?.success) {
        toast.success('Payment settings updated successfully');
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {t('admin.settings.payment.title') || 'Payment Provider Settings'}
      </h1>
      
      {/* Stripe Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Stripe
          </h2>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paymentProviders?.stripe?.enabled}
              onChange={() => handleToggle('stripe', 'enabled')}
              className="mr-2"
            />
            <span className="text-sm font-medium">
              {settings.paymentProviders?.stripe?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Configuration:</strong> Detected from STRIPE_SECRET_KEY environment variable
          </p>
          {settings.paymentProviders?.stripe?.publicKey && (
            <p>
              <strong>Public Key:</strong>{' '}
              {settings.paymentProviders.stripe.publicKey.substring(0, 12)}...
            </p>
          )}
          <div className="mt-3">
            <strong>Features:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>Global card support (Visa, Mastercard, AMEX)</li>
              <li>3D Secure authentication</li>
              <li>135+ currencies</li>
              <li>PCI DSS Level 1 compliant</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* PayTR Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-2xl">🇹🇷</span>
            PayTR
          </h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.paymentProviders?.paytr?.testMode}
                onChange={() => handleToggle('paytr', 'testMode')}
                disabled={!settings.paymentProviders?.paytr?.enabled}
                className="mr-2"
              />
              <span className="text-sm font-medium">Test Mode</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.paymentProviders?.paytr?.enabled}
                onChange={() => handleToggle('paytr', 'enabled')}
                className="mr-2"
              />
              <span className="text-sm font-medium">
                {settings.paymentProviders?.paytr?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Configuration:</strong> Set via environment variables
          </p>
          <div className="mt-3">
            <strong>Features:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>Turkish card support (Troy, Visa, Mastercard)</li>
              <li>Installment payments (up to 12 months)</li>
              <li>3D Secure authentication</li>
              <li>Turkish Lira optimized</li>
            </ul>
          </div>
          
          {settings.paymentProviders?.paytr?.testMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800 mb-2">
                ⚠️ Test Mode Active
              </p>
              <p className="text-sm text-yellow-700">
                Use test cards only. Real cards will not work.
                <br />
                Test Card: 4355084355084358 (Expiry: 12/30, CVV: 000)
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Important Notes</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Payment provider credentials are stored in environment variables for security</li>
          <li>• Changes take effect immediately for new bookings</li>
          <li>• Disabling a provider will hide it from the payment page</li>
          <li>• Test mode should only be used in development/staging environments</li>
          <li>• Always verify payment flow after making changes</li>
        </ul>
      </div>
    </div>
  );
}

export default PaymentSettingsPage;
```

## Implementation Steps

### 1. Create Route

Add to `src/App.jsx` or admin routes:

```jsx
import PaymentSettingsPage from './pages/admin/settings/PaymentSettingsPage';

// In admin routes:
<Route path="/admin/settings/payments" element={<PaymentSettingsPage />} />
```

### 2. Add Navigation Link

In admin settings navigation:

```jsx
<Link to="/admin/settings/payments">
  <span className="icon">💳</span>
  Payment Providers
</Link>
```

### 3. Permissions

Ensure route is protected with admin auth:

```jsx
<Route 
  path="/admin/settings/payments" 
  element={
    <RequireAuth allowedRoles={['Super Admin', 'Admin']}>
      <PaymentSettingsPage />
    </RequireAuth>
  } 
/>
```

### 4. Translation Keys

Add to translation files (`src/locales/*/translation.json`):

```json
{
  "admin": {
    "settings": {
      "payment": {
        "title": "Payment Provider Settings",
        "stripe": {
          "title": "Stripe",
          "enabled": "Enabled",
          "disabled": "Disabled"
        },
        "paytr": {
          "title": "PayTR",
          "testMode": "Test Mode",
          "testModeWarning": "Test mode is active. Use test cards only."
        },
        "saveSuccess": "Payment settings updated successfully",
        "saveFailed": "Failed to save payment settings"
      }
    }
  }
}
```

## Security Considerations

1. **Environment Variables:** Never expose merchant keys or secrets in the admin UI
2. **Read-Only Display:** Show only masked/partial credentials
3. **Admin Only:** Restrict access to Super Admin and Admin roles
4. **Audit Logging:** Log all changes to payment settings
5. **Validation:** Validate settings before saving
6. **Test Mode Warning:** Show prominent warning when test mode is enabled in production

## Testing the UI

1. **Access Control:**
   - Verify only admins can access the page
   - Test unauthorized access returns 403

2. **Settings Load:**
   - Verify current settings load correctly
   - Test error handling when API fails

3. **Toggle Functionality:**
   - Test enabling/disabling each provider
   - Verify test mode toggle works

4. **Save Operation:**
   - Test saving with valid data
   - Test error handling on save failure
   - Verify success message displayed

5. **Visual Indicators:**
   - Test mode warning shows when active
   - Enabled/disabled states clear
   - Loading states work correctly

## Future Enhancements

- [ ] Add payment provider health check
- [ ] Show transaction statistics per provider
- [ ] Add payment method priority/ordering
- [ ] Support for additional payment providers
- [ ] Test transaction feature (admin-initiated test payment)
- [ ] Payment provider performance metrics
- [ ] Auto-detect optimal provider by customer location

## Resources

- [GlobalSettings Model](../backend/models/GlobalSettings.mjs)
- [GlobalSettings Routes](../backend/routes/globalSettingsRoutes.mjs)
- [Payment Integration Guide](PAYTR_INTEGRATION.md)
