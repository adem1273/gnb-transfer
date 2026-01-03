# PayTR Integration Testing Guide

This guide provides comprehensive instructions for testing the PayTR payment gateway integration in GNB Transfer.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test Environment Setup](#test-environment-setup)
- [Running Automated Tests](#running-automated-tests)
- [Manual Testing Scenarios](#manual-testing-scenarios)
- [End-to-End Testing](#end-to-end-testing)
- [Production Deployment Testing](#production-deployment-testing)
- [Troubleshooting Test Issues](#troubleshooting-test-issues)

---

## Prerequisites

Before testing PayTR integration, ensure you have:

### Required
- ✅ PayTR test merchant account credentials
- ✅ Node.js 18+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Backend and frontend development servers running
- ✅ Test environment variables configured

### Optional (for advanced testing)
- ngrok or similar tunneling tool (for IPN callback testing)
- Stripe CLI (if testing both payment providers)
- MongoDB Compass (for database inspection)

---

## Test Environment Setup

### 1. Configure Test Environment Variables

**Backend** (`backend/.env.test` or `backend/.env`):

```env
# MongoDB (use separate test database)
MONGO_URI=mongodb://localhost:27017/gnb-transfer-test

# JWT Authentication
JWT_SECRET=test-jwt-secret-key-for-development-only
JWT_REFRESH_SECRET=test-refresh-secret-key

# PayTR Test Credentials
PAYTR_MERCHANT_ID=your_test_merchant_id
PAYTR_MERCHANT_KEY=your_test_merchant_key
PAYTR_MERCHANT_SALT=your_test_merchant_salt
PAYTR_TEST_MODE=true

# Server Configuration
NODE_ENV=test
PORT=5000
FRONTEND_URL=http://localhost:5173

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend** (`.env`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYTR_ENABLED=true
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (from root)
cd ..
npm install
```

### 3. Seed Test Data

```bash
cd backend

# Seed database with test data
npm run seed

# Or create minimal test data
node scripts/create-test-admin.mjs
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Terminal 3 - ngrok (for IPN testing):**
```bash
ngrok http 5000
```

---

## Running Automated Tests

### Unit Tests

Test the PayTR service functions in isolation:

```bash
cd backend

# Run PayTR service tests only
npm test -- paytrService.test.mjs

# Run with coverage
npm run test:coverage -- paytrService.test.mjs

# Watch mode (re-run on file changes)
npm run test:watch -- paytrService.test.mjs
```

**Test Coverage:**
- ✅ Hash generation and verification
- ✅ Basket data creation
- ✅ Payment token creation
- ✅ IPN callback processing
- ✅ Success/failure redirect handling
- ✅ Payment status retrieval
- ✅ Error handling scenarios

### Integration Tests

Test API endpoints with actual HTTP requests:

```bash
cd backend

# Run all integration tests
npm test -- tests/integration/

# Run PayTR-specific integration tests (if available)
npm test -- paytr
```

### Frontend Tests

Test PayTR React components:

```bash
# From project root
npm test

# Run specific component tests
npm test -- PayTRPayment

# Watch mode
npm run test:watch
```

---

## Manual Testing Scenarios

### Scenario 1: Successful Payment (Standard Card)

**Objective:** Verify standard successful payment flow without 3D Secure.

**Steps:**

1. **Create a booking:**
   - Navigate to http://localhost:5173
   - Create a new booking (pickup, dropoff, passenger details)
   - Note the booking ID

2. **Access payment page:**
   - Navigate to `/payment` with the booking ID
   - Verify PayTR option is displayed

3. **Select PayTR:**
   - Click PayTR payment option
   - Verify iframe loads with PayTR payment form

4. **Enter test card:**
   - Card Number: `4355084355084358`
   - Expiry: `12/30`
   - CVV: `000`
   - Name: `TEST USER`

5. **Submit payment:**
   - Click "Pay Now" or equivalent
   - Verify redirect to success page

6. **Verify booking status:**
   - API: `GET /api/bookings/{bookingId}`
   - Expected: `status: "paid"`
   - Check `paymentDetails.completedAt` is set

**Expected Results:**
- ✅ Payment iframe loads successfully
- ✅ Test card accepted without errors
- ✅ Redirect to success page
- ✅ Booking status updated to "paid"
- ✅ IPN callback received (check backend logs)

---

### Scenario 2: Failed Payment (Insufficient Funds)

**Objective:** Test error handling for declined transactions.

**Steps:**

1. Follow steps 1-3 from Scenario 1

2. **Enter failed test card:**
   - Card Number: `4090700090700006`
   - Expiry: `12/30`
   - CVV: `000`

3. **Submit payment:**
   - Expect payment to be declined
   - Verify redirect to failure page

4. **Verify booking status:**
   - API: `GET /api/bookings/{bookingId}`
   - Expected: `status: "pending"` (not paid)

**Expected Results:**
- ✅ Payment declined with appropriate error message
- ✅ Redirect to payment failed page
- ✅ Booking remains in pending status
- ✅ Error details logged in backend

---

### Scenario 3: 3D Secure Authentication

**Objective:** Verify 3D Secure authentication flow.

**Steps:**

1. Follow steps 1-3 from Scenario 1

2. **Enter 3D Secure test card:**
   - Card Number: `5571135571135575`
   - Expiry: `12/30`
   - CVV: `000`

3. **Submit payment:**
   - System redirects to 3D Secure verification page
   - Enter password: `12345`
   - Complete authentication

4. **Verify success:**
   - Redirect to success page
   - Booking status updated to "paid"

**Expected Results:**
- ✅ 3D Secure page loads
- ✅ Authentication with password `12345` succeeds
- ✅ Payment completes after authentication
- ✅ Success page displayed

---

### Scenario 4: Installment Payment

**Objective:** Test installment payment options.

**Steps:**

1. Create a booking with amount ≥ 100 TRY

2. Access payment page and select PayTR

3. **Configure installment:**
   - In payment request, set `maxInstallment: 12`
   - Or modify PayTRPayment component to allow installments

4. **Enter card and select installments:**
   - Card: `4355084355084358`
   - Choose 3, 6, or 12 installments
   - Complete payment

5. **Verify:**
   - Payment successful with installment info
   - Check `paymentDetails.installments` in booking

**Expected Results:**
- ✅ Installment options displayed (3, 6, 12 months)
- ✅ Payment successful with selected installment
- ✅ Installment details saved in booking

---

### Scenario 5: Payment Cancellation

**Objective:** Test user canceling payment in iframe.

**Steps:**

1. Create booking and access payment page

2. Select PayTR

3. **Cancel payment:**
   - Click "Cancel" or close iframe (if available)
   - Or wait for payment timeout (30 minutes)

4. **Verify:**
   - Redirect to failure page
   - Booking remains pending
   - User can retry payment

**Expected Results:**
- ✅ Graceful handling of cancellation
- ✅ Booking status not changed
- ✅ User can initiate new payment attempt

---

### Scenario 6: IPN Callback Verification

**Objective:** Verify IPN callback is received and processed correctly.

**Setup:**
1. Start ngrok: `ngrok http 5000`
2. Get ngrok URL (e.g., `https://abc123.ngrok.io`)
3. Update PayTR merchant panel IPN URL:
   ```
   https://abc123.ngrok.io/api/payments/paytr/callback
   ```

**Steps:**

1. Create booking and complete payment (Scenario 1)

2. **Monitor backend logs:**
   ```bash
   tail -f backend/logs/combined.log
   ```

3. **Verify IPN callback:**
   - Look for "PayTR IPN callback received" log entry
   - Check hash verification passed
   - Verify booking status updated

4. **Check IPN data:**
   - `merchant_oid`: Matches booking
   - `status`: 'success' or 'failed'
   - `hash`: Valid and verified
   - `total_amount`: Matches booking amount (in kuruş)

**Expected Results:**
- ✅ IPN callback received within 5 seconds of payment
- ✅ Hash verification successful
- ✅ Booking updated before user redirect
- ✅ Backend returns "OK" to acknowledge

---

### Scenario 7: Multiple Currency Support

**Objective:** Test PayTR with different currencies (if supported).

**Steps:**

1. Create booking with `currency: "USD"` or `"EUR"`

2. Access payment page

3. Complete payment with test card

4. **Verify:**
   - Currency correctly passed to PayTR
   - Amount converted properly
   - Payment successful

**Expected Results:**
- ✅ Multi-currency payments work (if enabled)
- ✅ Currency conversion accurate
- ✅ Amount displayed correctly

---

### Scenario 8: Payment Provider Selection

**Objective:** Verify users can choose between Stripe and PayTR.

**Setup:**
- Ensure both `VITE_STRIPE_PUBLIC_KEY` and PayTR are configured

**Steps:**

1. Create booking

2. Navigate to payment page

3. **Verify options displayed:**
   - Stripe option visible (💳 Credit/Debit Card)
   - PayTR option visible (🇹🇷 PayTR)

4. **Test switching:**
   - Select Stripe → Stripe form loads
   - Switch to PayTR → PayTR iframe loads

5. Complete payment with either option

**Expected Results:**
- ✅ Both payment options displayed
- ✅ Switching between providers works
- ✅ Selected provider highlighted/checked
- ✅ Payment successful with either option

---

## End-to-End Testing

### Complete Booking Flow

**Objective:** Test complete user journey from booking to payment confirmation.

**Steps:**

1. **Guest Booking:**
   - Navigate to homepage
   - Click "Book Now"
   - Fill booking form (pickup, dropoff, date, passengers)
   - Submit booking

2. **Email Confirmation:**
   - Check email for booking confirmation
   - Click payment link in email

3. **Payment:**
   - Select PayTR
   - Complete payment with test card
   - Verify success page

4. **Booking Confirmation:**
   - Check email for payment confirmation
   - Verify booking details in email

5. **Admin Verification:**
   - Login to admin panel
   - Navigate to Bookings
   - Verify booking shows as "paid"
   - Check payment details

**Expected Results:**
- ✅ Seamless booking flow
- ✅ Emails sent at appropriate steps
- ✅ Payment links work correctly
- ✅ Admin panel reflects accurate status

---

## Production Deployment Testing

### Pre-Production Checklist

Before deploying PayTR to production:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed for all scenarios
- [ ] IPN callback tested with production URL
- [ ] Production merchant credentials configured
- [ ] `PAYTR_TEST_MODE=false` in production
- [ ] HTTPS enabled on production domain
- [ ] PayTR merchant panel IPN URL updated to production
- [ ] Security review completed
- [ ] Error logging configured (Sentry)
- [ ] Monitoring alerts set up

### Smoke Tests in Production

After deployment, run these minimal tests:

1. **Health Check:**
   ```bash
   curl https://yourdomain.com/api/health
   # Expected: {"status":"OK"}
   ```

2. **PayTR Config Check:**
   ```bash
   curl https://yourdomain.com/api/payments/paytr/config
   # Expected: {"success":true,"data":{"configured":true,"testMode":false}}
   ```

3. **Small Test Transaction:**
   - Create a real booking with minimum amount
   - Complete payment with real card
   - Verify status update
   - Refund transaction if needed

4. **Monitor Logs:**
   - Watch for errors in first few hours
   - Check IPN callbacks arriving correctly
   - Verify no hash errors

---

## Troubleshooting Test Issues

### Issue: Payment iframe doesn't load

**Causes & Solutions:**

1. **CORS Error:**
   - Check browser console for CORS errors
   - Ensure PayTR domain allowed in CSP headers
   - Verify `CORS_ORIGINS` includes frontend URL

2. **Invalid Token:**
   - Check backend logs for token creation errors
   - Verify merchant credentials are correct
   - Ensure hash calculation is correct

3. **Network Error:**
   - Verify PayTR API is accessible
   - Check firewall rules
   - Test with `curl` to PayTR API

### Issue: IPN callback not received

**Causes & Solutions:**

1. **Server Not Publicly Accessible:**
   - Use ngrok for local testing
   - Verify production URL is HTTPS
   - Check firewall allows PayTR IPs

2. **Hash Verification Failed:**
   - Review hash calculation logic
   - Ensure merchant key and salt correct
   - Check parameter order in hash string

3. **Endpoint Not Responding:**
   - Verify route is registered: `POST /api/payments/paytr/callback`
   - Check backend logs for errors
   - Ensure endpoint returns "OK"

### Issue: Test card rejected

**Causes & Solutions:**

1. **Wrong Test Mode:**
   - Ensure `PAYTR_TEST_MODE=true`
   - Restart backend after changing env var
   - Verify test mode parameter sent to PayTR

2. **Incorrect Card Details:**
   - Use exact test card numbers from docs
   - Expiry must be future date (12/30 recommended)
   - CVV must be 000 for test cards

3. **Merchant Account Issue:**
   - Verify merchant account is active
   - Check test mode is enabled in PayTR panel
   - Contact PayTR support if persistent

### Issue: Booking status not updating

**Causes & Solutions:**

1. **IPN Not Processed:**
   - Check if IPN callback received (backend logs)
   - Verify hash verification passed
   - Check database connection

2. **Database Error:**
   - Check MongoDB connection
   - Verify booking ID format correct
   - Look for error logs in backend

3. **Race Condition:**
   - IPN might arrive after redirect
   - Implement polling on success page
   - Check status with delay (2-3 seconds)

---

## Test Checklist Summary

Use this checklist before marking PayTR integration as complete:

### Unit Tests
- [ ] Hash generation tests pass
- [ ] Hash verification tests pass
- [ ] Basket data creation tests pass
- [ ] Payment token creation tests pass
- [ ] IPN callback processing tests pass
- [ ] Error handling tests pass

### Manual Tests
- [ ] Successful payment (standard card)
- [ ] Failed payment (declined card)
- [ ] 3D Secure authentication
- [ ] Installment payment
- [ ] Payment cancellation
- [ ] IPN callback verification
- [ ] Payment provider selection

### Integration Tests
- [ ] API endpoint tests pass
- [ ] Database updates work correctly
- [ ] Email notifications sent
- [ ] Webhook handling works

### End-to-End Tests
- [ ] Complete booking flow works
- [ ] Admin panel displays correct status
- [ ] User receives confirmation emails
- [ ] Payment history accessible

### Production Readiness
- [ ] Production credentials configured
- [ ] IPN callback URL set to production
- [ ] HTTPS enabled
- [ ] Error monitoring active
- [ ] Documentation complete
- [ ] Team trained on troubleshooting

---

## Additional Resources

- [PayTR Integration Docs](PAYTR_INTEGRATION.md)
- [PayTR Official API Docs](https://dev.paytr.com/)
- [Backend Test Files](../backend/tests/services/paytrService.test.mjs)
- [Payment Integration README](../README.md#-payment-integration)

---

## Support

If you encounter issues not covered in this guide:

1. Check backend logs: `backend/logs/combined.log`
2. Review PayTR merchant panel for transaction details
3. Consult PayTR support documentation
4. Open an issue on GitHub with:
   - Test scenario being executed
   - Error messages from logs
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
