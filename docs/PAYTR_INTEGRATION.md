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

## Test Cards

Use these cards when `PAYTR_TEST_MODE=true`:

### Successful Payment
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| 4355 0843 5508 4358 | 12/30 | 000 |

### Failed Payment
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| 4090 7000 9070 0006 | 12/30 | 000 |

### 3D Secure Test
| Card Number | Expiry | CVV |
|-------------|--------|-----|
| 5571 1355 7113 5575 | 12/30 | 000 |

**3D Secure Password:** 12345

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
