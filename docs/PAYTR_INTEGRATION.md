# PayTR Payment Gateway Integration

This document describes the integration of PayTR payment gateway into the GNB Transfer backend alongside the existing Stripe integration.

## Overview

PayTR is a popular Turkish payment gateway that supports:
- Credit/Debit card payments
- Bank transfers (EFT/Havale)
- Installment payments
- 3D Secure authentication
- Turkish Lira (TRY) and multi-currency support

## Environment Configuration

Add the following variables to your `.env` file:

```env
# PayTR Configuration (Required)
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_MERCHANT_KEY=your_merchant_key
PAYTR_MERCHANT_SALT=your_merchant_salt

# Set to 'true' for test mode, 'false' for production
PAYTR_TEST_MODE=true

# Optional: Frontend URL for redirects
FRONTEND_URL=https://your-domain.com
```

### Getting Credentials

1. Sign up for a PayTR merchant account at [https://www.paytr.com](https://www.paytr.com)
2. Complete the merchant verification process
3. Access the Merchant Panel → API Integration section
4. Copy your Merchant ID, Merchant Key, and Merchant Salt

## API Endpoints

### Check PayTR Configuration

```
GET /api/payments/paytr/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "testMode": true
  }
}
```

### Create Payment Token

```
POST /api/payments/paytr/create
```

**Request Body:**
```json
{
  "bookingId": "507f1f77bcf86cd799439011",
  "successUrl": "https://your-domain.com/payment/success",
  "failUrl": "https://your-domain.com/payment/failed",
  "maxInstallment": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "paytr_token_here",
    "merchantOid": "GNB-507f1f77bcf86cd799439011-1704312000000",
    "iframeUrl": "https://www.paytr.com/odeme/guvenli/paytr_token_here"
  },
  "message": "Payment token created successfully"
}
```

### IPN Callback (Webhook)

```
POST /api/payments/paytr/callback
Content-Type: application/x-www-form-urlencoded
```

This endpoint is called by PayTR servers when a payment status changes. **Do not call this endpoint manually.**

PayTR will send the following parameters:
- `merchant_oid`: Order ID
- `status`: 'success' or 'failed'
- `total_amount`: Total amount in kuruş
- `hash`: Verification hash
- `failed_reason_code`: (if failed) Error code
- `failed_reason_msg`: (if failed) Error message

The endpoint must return `OK` to acknowledge receipt.

### Payment Success Redirect

```
GET /api/payments/paytr/success?merchant_oid=GNB-xxx-xxx
```

Users are redirected here after successful payment. If `FRONTEND_URL` is set, redirects to `${FRONTEND_URL}/payment/success`.

### Payment Failure Redirect

```
GET /api/payments/paytr/fail?merchant_oid=GNB-xxx-xxx
```

Users are redirected here after failed payment. If `FRONTEND_URL` is set, redirects to `${FRONTEND_URL}/payment/failed`.

### Get Payment Status

```
GET /api/payments/paytr/status/:bookingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "507f1f77bcf86cd799439011",
    "paymentMethod": "paytr",
    "paymentStatus": "completed",
    "bookingStatus": "paid",
    "amount": 150.00
  }
}
```

## Frontend Integration

### Embedding the Payment iFrame

After creating a payment token, embed the PayTR payment page in an iframe:

```html
<iframe 
  src="https://www.paytr.com/odeme/guvenli/{token}" 
  id="paytriframe" 
  frameborder="0" 
  scrolling="no"
  style="width: 100%;">
</iframe>

<script>
  iFrameResize({}, '#paytriframe');
</script>
```

### React Component Example

```jsx
import { useEffect, useState } from 'react';

const PaytrPayment = ({ bookingId }) => {
  const [iframeUrl, setIframeUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const response = await fetch('/api/payments/paytr/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            successUrl: `${window.location.origin}/payment/success`,
            failUrl: `${window.location.origin}/payment/failed`,
            maxInstallment: 0,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setIframeUrl(data.data.iframeUrl);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to initialize payment');
      }
    };

    initPayment();
  }, [bookingId]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!iframeUrl) {
    return <div>Loading payment...</div>;
  }

  return (
    <iframe
      src={iframeUrl}
      style={{ width: '100%', height: '600px', border: 'none' }}
      title="PayTR Payment"
    />
  );
};

export default PaytrPayment;
```

## Hash Calculation

PayTR uses HMAC SHA256 for request verification. Here's how the hash is calculated:

### Token Request Hash

```javascript
// Order of parameters is critical!
const hashStr = [
  merchantId,
  userIp,
  merchantOid,
  email,
  paymentAmount,    // In kuruş (amount * 100)
  userBasket,       // Base64 encoded JSON
  noInstallment,    // '0' or '1'
  maxInstallment,   // '0' to '12'
  currency,         // 'TL', 'USD', 'EUR', 'GBP'
  testMode,         // '0' or '1'
].join('');

const hashInput = hashStr + merchantSalt;
const hash = crypto
  .createHmac('sha256', merchantKey)
  .update(hashInput)
  .digest('base64');
```

### IPN Verification Hash

```javascript
const hashStr = [
  merchantOid,
  merchantSalt,
  status,        // 'success' or 'failed'
  totalAmount,   // In kuruş
].join('');

const expectedHash = crypto
  .createHmac('sha256', merchantKey)
  .update(hashStr)
  .digest('base64');

// Compare with received hash (use timing-safe comparison)
const isValid = crypto.timingSafeEqual(
  Buffer.from(receivedHash, 'base64'),
  Buffer.from(expectedHash, 'base64')
);
```

### Basket Data Format

```javascript
const basketItems = [
  ['Product Name', 'Price in kuruş', 'Quantity'],
  ['Transfer Service', '15000', '1'],
  ['Extra Services', '1000', '1'],
];

const userBasket = Buffer.from(JSON.stringify(basketItems)).toString('base64');
```

## Sandbox Testing

### Test Mode Configuration

To use PayTR in test/sandbox mode, set the following in your `.env` file:

```env
PAYTR_TEST_MODE=true
PAYTR_MERCHANT_ID=your_test_merchant_id
PAYTR_MERCHANT_KEY=your_test_merchant_key
PAYTR_MERCHANT_SALT=your_test_merchant_salt
```

**Important Notes:**
- Test transactions use the same API endpoint as production
- The `test_mode` parameter (set to `1`) differentiates test from production
- Test transactions do NOT charge real money
- Use only test cards provided below - real cards will fail in test mode
- Test transactions appear in your PayTR test dashboard

### Test Cards

Use these test cards when `PAYTR_TEST_MODE=true`:

#### 1. Successful Payment (Standard)
| Card Number | Expiry | CVV | Card Type | Notes |
|-------------|--------|-----|-----------|-------|
| 4355084355084358 | 12/30 | 000 | Visa | Instant approval, no 3D Secure |

**Test Scenario:** Standard successful payment without additional verification.

#### 2. Failed Payment Tests
| Card Number | Expiry | CVV | Card Type | Failure Reason |
|-------------|--------|-----|-----------|----------------|
| 4090700090700006 | 12/30 | 000 | Visa | Insufficient funds |

**Test Scenario:** Simulates a declined transaction. Use this to test error handling.

#### 3. 3D Secure Authentication
| Card Number | Expiry | CVV | Card Type | Notes |
|-------------|--------|-----|-----------|-------|
| 5571135571135575 | 12/30 | 000 | Mastercard | Requires 3D Secure verification |

**3D Secure Test Password:** `12345`

**Test Scenario:** 
1. Enter card details
2. System redirects to 3D Secure verification page
3. Enter password: `12345`
4. Transaction completes successfully

#### 4. Additional Test Cards

**For Installment Testing:**
| Card Number | Expiry | CVV | Max Installments |
|-------------|--------|-----|------------------|
| 4355084355084358 | 12/30 | 000 | Up to 12 |

**Card Holder Name:** Any name (e.g., "TEST USER")

### Sandbox Testing Checklist

Before going live, test the following scenarios:

- [ ] **Successful Payment**: Complete payment with test card 4355084355084358
- [ ] **Failed Payment**: Verify error handling with card 4090700090700006
- [ ] **3D Secure Flow**: Test authentication with card 5571135571135575
- [ ] **Installment Payment**: Test 3, 6, and 12 installment options
- [ ] **Payment Cancellation**: Cancel payment in the iframe and verify redirect
- [ ] **IPN Callback**: Verify webhook receives status updates
- [ ] **Hash Verification**: Ensure callback hash validation works correctly
- [ ] **Multiple Currencies**: Test with TRY, USD, EUR if supported
- [ ] **Mobile Payment**: Test payment flow on mobile devices
- [ ] **Payment Timeout**: Let payment session expire (30 minutes) and verify handling

### Testing the IPN Callback

PayTR sends IPN (Instant Payment Notification) callbacks to your server. To test locally:

#### Option 1: Using ngrok (Recommended for Local Development)

```bash
# Install ngrok (if not already installed)
# Download from: https://ngrok.com/download

# Start your backend server
cd backend && npm run dev

# In a new terminal, expose your local server
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update BACKEND_URL in .env to this ngrok URL
```

Then configure the IPN callback URL in your PayTR test merchant panel:
```
https://abc123.ngrok.io/api/payments/paytr/callback
```

#### Option 2: Using Deployed Test Environment

Deploy to a test server (Render, Railway, etc.) and use the deployed URL for IPN callbacks.

#### Verifying IPN Callbacks

1. **Check Server Logs**: Monitor backend logs for incoming IPN requests
   ```bash
   tail -f backend/logs/combined.log
   ```

2. **Expected IPN Parameters**:
   - `merchant_oid`: Your order ID (format: GNB-{bookingId}-{timestamp})
   - `status`: 'success' or 'failed'
   - `total_amount`: Amount in kuruş (TRY * 100)
   - `hash`: Verification hash
   - `test_mode`: '1' for test transactions

3. **Test IPN Response**: Your endpoint must return `OK` to acknowledge receipt

### End-to-End Test Flow

Complete test scenario from booking to payment confirmation:

```bash
# 1. Create a test booking
POST /api/bookings
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+905551234567",
  "pickupLocation": "Istanbul Airport",
  "dropoffLocation": "Sultanahmet",
  "passengerCount": 2,
  "amount": 150
}

# 2. Create payment token
POST /api/payments/paytr/create
{
  "bookingId": "{booking_id_from_step_1}",
  "successUrl": "http://localhost:5173/payment/success",
  "failUrl": "http://localhost:5173/payment/failed",
  "maxInstallment": 12
}

# 3. Open iframe URL in browser
# Use test card: 4355084355084358

# 4. Verify booking status updated
GET /api/bookings/{booking_id}
# Should show status: "paid"
```

### Common Test Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Hash error" in response | Verify merchant credentials, check parameter order |
| IPN callback not received | Ensure server is publicly accessible, check firewall |
| Payment iframe shows error | Check browser console, verify CSP headers allow PayTR |
| Test card rejected | Ensure PAYTR_TEST_MODE=true, use exact test card numbers |
| 3D Secure page doesn't load | Wait a few seconds, check internet connection |

### Moving to Production

Before switching to production mode:

1. **Get Production Credentials**
   - Complete PayTR merchant verification
   - Obtain production Merchant ID, Key, and Salt
   
2. **Update Environment Variables**
   ```env
   PAYTR_TEST_MODE=false
   PAYTR_MERCHANT_ID=production_merchant_id
   PAYTR_MERCHANT_KEY=production_merchant_key
   PAYTR_MERCHANT_SALT=production_merchant_salt
   ```

3. **Configure Production IPN URL**
   - Set callback URL in PayTR merchant panel
   - Use your production domain (HTTPS required)
   - Format: `https://yourdomain.com/api/payments/paytr/callback`

4. **Security Checklist**
   - [ ] All secrets stored in environment variables
   - [ ] HTTPS enabled on production server
   - [ ] IPN hash verification enabled
   - [ ] Error logging configured (without exposing secrets)
   - [ ] Rate limiting enabled on payment endpoints
   - [ ] CORS configured for your domain only

5. **Test with Real Cards**
   - Start with small amounts
   - Test all payment flows
   - Monitor for errors in first few transactions

## Error Codes

| Code | Description |
|------|-------------|
| 1 | Transaction declined by bank |
| 2 | Card number invalid |
| 3 | Card expired |
| 4 | Insufficient funds |
| 5 | CVV error |
| 6 | 3D Secure authentication failed |
| 7 | Transaction limit exceeded |
| 8 | Card blocked |
| 9 | General error |
| 10 | Timeout |
| 11 | Connection error |
| 12 | Hash error |

## Security Considerations

1. **Never log sensitive data**: Merchant key and salt should never appear in logs
2. **Verify all callbacks**: Always verify the IPN hash before processing
3. **Use HTTPS**: All PayTR communication must be over HTTPS
4. **IP Whitelisting**: Consider whitelisting PayTR's IP addresses for callbacks
5. **Idempotency**: IPN callbacks may be sent multiple times - handle duplicates gracefully

## Troubleshooting

### Hash Error
- Ensure parameters are in the exact order specified
- Check that payment amount is in kuruş (multiply by 100)
- Verify merchant key and salt are correct
- Ensure no extra whitespace in values

### Callback Not Received
- Check that your server is publicly accessible
- Verify the callback URL in PayTR merchant panel
- Check firewall rules for PayTR IP addresses
- Review server logs for incoming requests

### Payment Iframe Not Loading
- Ensure the token was created successfully
- Check browser console for CORS errors
- Verify Content-Security-Policy allows PayTR domains

## PayTR Documentation

For more details, visit the official PayTR developer documentation:
- [https://dev.paytr.com/](https://dev.paytr.com/)
- [API Reference](https://dev.paytr.com/iframe-api/)
- [Hash Calculation](https://dev.paytr.com/odeme/iframe-api/hash-olusturma/)
