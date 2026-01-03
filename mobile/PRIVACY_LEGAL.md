# Privacy & Legal Requirements Guide

This guide outlines the privacy and legal requirements for the GNB Transfer mobile app to comply with app store policies and data protection regulations.

---

## ⚠️ Legal Disclaimer

> **This guide provides technical and informational guidance only. It is NOT legal advice.**
>
> Privacy laws vary by jurisdiction. Consult with a qualified legal professional to ensure full compliance with:
> - GDPR (Europe)
> - CCPA (California)
> - Other regional data protection laws
> - App Store and Play Store policies

---

## 📋 Required Legal Documents

Both Apple App Store and Google Play Store **require** the following legal documents:

| Document | Required By | Purpose | URL Format |
|----------|-------------|---------|------------|
| **Privacy Policy** | ✅ Both | Disclose data collection and usage | `https://gnbtransfer.com/privacy-policy` |
| **Terms of Service** | ⚠️ Recommended | Define service terms and user agreements | `https://gnbtransfer.com/terms-of-service` |

### Where to Configure URLs

**In app.json:**
```json
{
  "expo": {
    "extra": {
      "privacyPolicyUrl": "https://gnbtransfer.com/privacy-policy",
      "termsOfServiceUrl": "https://gnbtransfer.com/terms-of-service",
      "supportEmail": "support@gnbtransfer.com"
    }
  }
}
```

**In App Stores:**
- **Apple App Store Connect:** General App Information → Privacy Policy URL
- **Google Play Console:** Store presence → Privacy Policy

---

## 🔒 Privacy Policy Requirements

Your Privacy Policy **must** be:
- ✅ Publicly accessible (no login required)
- ✅ In plain language (understandable by average user)
- ✅ Up-to-date with current practices
- ✅ Specific to your app (not a generic template)

### Minimum Content Requirements

A compliant Privacy Policy must include:

#### 1. Introduction & Contact Information

```markdown
**Last Updated:** January 1, 2026

GNB Transfer ("we," "our," or "us") operates the GNB Transfer mobile application.

This Privacy Policy explains how we collect, use, and protect your personal information.

**Contact:**
Email: privacy@gnbtransfer.com
Address: [Your business address]
```

#### 2. Data Collection Statement

**What data does the app collect?**

| Data Type | Examples | Purpose |
|-----------|----------|---------|
| **Personal Information** | Name, email, phone number | Account creation, booking management, customer support |
| **Booking Details** | Pickup/dropoff locations, passenger count, dates | Service fulfillment |
| **Payment Information** | Credit card details | Handled by Stripe/PayTR (we don't store card numbers) |
| **Device Information** | Device type, OS version, app version | Crash reporting, app improvement |
| **Usage Data** | App interactions, errors, crashes | App stability and performance monitoring |

**What data does the app NOT collect?**
- ❌ Precise GPS location (app uses text input for locations)
- ❌ Photos or media files
- ❌ Contacts
- ❌ Microphone or camera access
- ❌ Browsing history

#### 3. How Data is Used

```markdown
We use your information to:
- Provide and improve our services
- Process bookings and payments
- Communicate about bookings and support requests
- Send service updates and notifications
- Improve app stability and performance
- Comply with legal obligations
```

#### 4. Data Sharing & Third Parties

**Third-party services used:**

| Service | Purpose | Data Shared | Privacy Policy |
|---------|---------|-------------|----------------|
| **Sentry** | Crash reporting | Device info, app version, error logs (no PII) | [sentry.io/privacy](https://sentry.io/privacy/) |
| **Stripe** | Payment processing | Payment info (tokenized) | [stripe.com/privacy](https://stripe.com/privacy) |
| **PayTR** | Payment processing (Turkey) | Payment info | [paytr.com/gizlilik-politikasi](https://www.paytr.com/gizlilik-politikasi) |

**We do NOT:**
- ❌ Sell your personal data
- ❌ Share data with advertisers
- ❌ Use data for tracking or advertising

#### 5. Data Security

```markdown
We implement industry-standard security measures:
- Data encrypted in transit (HTTPS/TLS)
- Secure authentication (JWT tokens)
- PCI-compliant payment processing
- Regular security audits
- Access controls and employee training
```

#### 6. User Rights (GDPR / CCPA)

**Users have the right to:**

- ✅ **Access:** Request a copy of your personal data
- ✅ **Correction:** Update or correct your information
- ✅ **Deletion:** Request deletion of your account and data
- ✅ **Portability:** Receive your data in a structured format
- ✅ **Opt-out:** Unsubscribe from marketing communications

**How to exercise rights:**
```markdown
Email: privacy@gnbtransfer.com
Subject: Data Rights Request
Include: Your name, email, and specific request
Response time: Within 30 days
```

#### 7. Children's Privacy

```markdown
Our app is not intended for users under 18.

We do not knowingly collect data from children under 13 (or 16 in the EU).

If we discover we've collected a child's data, we will delete it immediately.
```

#### 8. Data Retention

```markdown
We retain your data:
- Account data: Until account deletion requested
- Booking data: 7 years (for legal/tax compliance)
- Crash logs: 90 days
- Usage analytics: 2 years

After retention period, data is permanently deleted or anonymized.
```

#### 9. International Data Transfers

```markdown
Your data may be transferred to servers located outside your country.

We ensure adequate safeguards are in place (e.g., Standard Contractual Clauses).

If you're in the EU, your data may be transferred to [countries with adequacy decisions or other safeguards].
```

#### 10. Cookie Policy (If Applicable)

If your app has an embedded web view:

```markdown
We use cookies for:
- Session management
- Authentication
- Analytics

You can control cookies through your device settings.
```

#### 11. Changes to Privacy Policy

```markdown
We may update this Privacy Policy from time to time.

Changes are effective when posted with a new "Last Updated" date.

We will notify users of material changes via email or in-app notification.
```

#### 12. Contact Information

```markdown
For privacy questions or concerns:

Email: privacy@gnbtransfer.com
Phone: [Your support phone]
Address: [Your business address]

For EU users, you may also contact your local data protection authority.
```

---

## 📜 Terms of Service Requirements

While not always required, Terms of Service are **strongly recommended** to protect your business.

### Minimum Content Requirements

#### 1. Service Description

```markdown
GNB Transfer provides airport transfer and tour booking services through a mobile application.

By using the app, you agree to these Terms of Service.
```

#### 2. User Accounts

```markdown
- You must be 18 or older to create an account
- You must provide accurate information
- You are responsible for maintaining account security
- You must not share your account credentials
- We reserve the right to suspend or terminate accounts for violations
```

#### 3. Booking & Payment Terms

```markdown
**Bookings:**
- Bookings are subject to availability
- Confirmation is sent via email
- Changes/cancellations must be made [X hours] in advance

**Payments:**
- Payments processed via Stripe/PayTR
- Charges are in [currency]
- Prices include [taxes/fees] or exclude [taxes/fees]

**Refunds:**
- Cancellations [X hours] before: Full refund
- Cancellations within [X hours]: [Percentage] refund
- No-shows: No refund
```

#### 4. User Conduct

```markdown
You agree NOT to:
- Violate any laws or regulations
- Impersonate others
- Use the app for fraudulent purposes
- Interfere with app functionality
- Reverse engineer or decompile the app
- Use automated tools to access the app
```

#### 5. Intellectual Property

```markdown
The app and its content are owned by GNB Transfer and protected by copyright.

You may not copy, modify, or distribute the app without permission.

User-generated content (if any) remains your property, but you grant us a license to use it.
```

#### 6. Disclaimers & Limitation of Liability

```markdown
**Service Availability:**
- We strive for 99.9% uptime but don't guarantee uninterrupted service
- We may suspend service for maintenance

**Disclaimer:**
- Services provided "as is" without warranties
- We are not liable for third-party service issues (e.g., flight delays)

**Limitation of Liability:**
- Our liability is limited to the amount you paid for the service
- We are not liable for indirect, incidental, or consequential damages
```

#### 7. Indemnification

```markdown
You agree to indemnify GNB Transfer from claims arising from:
- Your use of the app
- Your violation of these terms
- Your violation of third-party rights
```

#### 8. Dispute Resolution

```markdown
**Governing Law:**
These terms are governed by the laws of [Your jurisdiction].

**Dispute Resolution:**
- Initial resolution: Contact support@gnbtransfer.com
- Arbitration: [Specify arbitration process if applicable]
- Jurisdiction: [Specify courts with jurisdiction]
```

#### 9. Changes to Terms

```markdown
We may update these Terms from time to time.

Continued use of the app after changes constitutes acceptance.
```

#### 10. Termination

```markdown
We reserve the right to terminate or suspend access for:
- Violations of these terms
- Fraudulent activity
- Abuse of service

Upon termination, your right to use the app ceases immediately.
```

---

## 📱 App Store Specific Requirements

### Apple App Store

#### App Privacy Labels (App Store Connect)

Apple requires detailed disclosure in App Store Connect → App Privacy section.

**Data Types to Disclose:**

| Category | Data Type | Collected? | Purpose | Linked to User? |
|----------|-----------|-----------|---------|-----------------|
| **Contact Info** | Name | Yes | Account, Booking | Yes |
| **Contact Info** | Email | Yes | Account, Support | Yes |
| **Contact Info** | Phone | Yes | Booking Contact | Yes |
| **Location** | Precise | No | N/A | N/A |
| **Identifiers** | Device ID | Minimal | Crash reports | No |
| **Diagnostics** | Crash data | Yes | App stability | No |
| **Other** | Payment info | Via Stripe | Payment processing | Yes |

**Tracking Disclosure:**
- **Does your app track users?** → No (unless you implement analytics that track across apps/websites)

#### Data Deletion Mechanism

Apple requires apps to provide a way for users to:
1. Request account deletion
2. Delete all associated data

**Implementation:**
- Add "Delete Account" option in app settings
- Or provide instructions to email support for deletion

### Google Play Store

#### Data Safety Section (Google Play Console)

Similar to Apple, Google requires disclosure in Play Console → Policy → Data safety.

**Key Questions:**
1. Does your app collect or share user data? → **Yes**
2. Is all data encrypted in transit? → **Yes**
3. Do users have a way to request deletion? → **Yes**
4. Has your app committed to Google Play Families Policy? → **No** (not for children)

**Data Types:**
- Personal info: Name, email, phone
- App info and performance: Crash logs
- Financial info: Payment info (handled by Stripe/PayTR)

---

## 🌍 GDPR Compliance (EU Users)

If you have users in the European Union, GDPR compliance is **required**.

### Key GDPR Requirements

#### 1. Lawful Basis for Processing

You must have a lawful basis to process personal data:

| Processing Activity | Lawful Basis |
|---------------------|--------------|
| Account creation | Consent or Contract |
| Booking fulfillment | Contract |
| Marketing emails | Consent |
| Crash reporting | Legitimate interest |

#### 2. Consent Management

**For marketing communications:**
- ✅ Opt-in (not opt-out) required
- ✅ Clear, affirmative action (checkbox)
- ✅ Easy to withdraw consent
- ✅ Separate consent for different purposes

**Example:**
```
□ I agree to receive promotional emails from GNB Transfer
□ I agree to receive booking reminders via SMS
```

#### 3. Data Subject Rights

Implement mechanisms for users to:

- **Access:** Provide data export (JSON, CSV, PDF)
- **Rectification:** Allow profile editing
- **Erasure:** Account deletion functionality
- **Portability:** Data export in machine-readable format
- **Object:** Opt-out of marketing

**Implementation:**
- In-app settings for profile editing
- "Delete Account" button in settings
- "Export My Data" feature (downloads JSON/PDF)
- Email-based requests: privacy@gnbtransfer.com

#### 4. Data Protection Officer (DPO)

If required (depends on scale of processing):
- Appoint a DPO
- Include DPO contact in Privacy Policy

#### 5. Data Breach Notification

If a data breach occurs:
- Notify supervisory authority within **72 hours**
- Notify affected users if high risk
- Document the breach

#### 6. Privacy by Design

- Collect only necessary data
- Minimize data retention
- Encrypt data in transit and at rest
- Implement access controls

---

## 🇺🇸 CCPA Compliance (California Users)

If you have users in California, CCPA compliance is required.

### Key CCPA Requirements

#### 1. Notice at Collection

Inform users what data you collect and why:
- In Privacy Policy
- At the point of collection (e.g., signup form)

#### 2. Right to Know

Users can request:
- Categories of data collected
- Specific pieces of data
- How data is used and shared

**Response time:** 45 days

#### 3. Right to Delete

Users can request deletion of their data.

**Exceptions:** Legal obligations, contract fulfillment

#### 4. Right to Opt-Out of Sale

If you sell data (you don't):
- Provide "Do Not Sell My Personal Information" link
- Honor opt-out requests

#### 5. Non-Discrimination

Don't discriminate against users who exercise their rights:
- Same service quality
- Same pricing

---

## 🛡️ Data Security Best Practices

### Technical Measures

- ✅ **HTTPS/TLS:** All data in transit encrypted
- ✅ **JWT Authentication:** Secure token-based auth
- ✅ **Password Hashing:** bcrypt for password storage
- ✅ **Input Validation:** Prevent injection attacks
- ✅ **Rate Limiting:** Prevent brute force
- ✅ **Security Headers:** Helmet middleware (backend)

### Organizational Measures

- ✅ **Access Controls:** Role-based access
- ✅ **Employee Training:** Security awareness
- ✅ **Incident Response Plan:** Breach procedures
- ✅ **Regular Audits:** Security reviews
- ✅ **Vendor Management:** Third-party security review

### Data Minimization

Collect only what's necessary:
- ❌ Don't collect: SSN, date of birth, government IDs (unless required)
- ✅ Collect: Name, email, phone (for bookings)

---

## 📋 Compliance Checklist

Use this checklist to ensure full compliance:

### Legal Documents
- [ ] Privacy Policy written and published
- [ ] Terms of Service written and published
- [ ] Legal documents reviewed by attorney
- [ ] URLs added to app.json
- [ ] URLs added to app store listings

### App Store Compliance
- [ ] **Apple:** App Privacy labels completed in App Store Connect
- [ ] **Apple:** Data deletion mechanism implemented
- [ ] **Google:** Data Safety section completed in Play Console
- [ ] **Google:** Privacy Policy URL added

### GDPR (if applicable)
- [ ] Lawful basis for processing identified
- [ ] Consent mechanisms implemented
- [ ] Data subject rights mechanisms implemented (access, delete, export)
- [ ] DPO appointed (if required)
- [ ] Data breach procedures documented

### CCPA (if applicable)
- [ ] Notice at collection provided
- [ ] Right to know request process documented
- [ ] Right to delete implemented
- [ ] "Do Not Sell" link (if applicable)

### Data Security
- [ ] HTTPS/TLS encryption in place
- [ ] Secure authentication implemented
- [ ] Input validation on all forms
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Third-party security reviewed

### User-Facing Features
- [ ] "Delete Account" option in app settings
- [ ] "Export My Data" option (GDPR/CCPA)
- [ ] Privacy Policy link in app footer
- [ ] Terms of Service link in app footer
- [ ] Support email for privacy requests

---

## 📞 Resources

### Privacy Policy Generators
- [Termly Privacy Policy Generator](https://termly.io/products/privacy-policy-generator/)
- [PrivacyPolicies.com](https://www.privacypolicies.com/privacy-policy-generator/)
- [Iubenda](https://www.iubenda.com/en/privacy-policy-generator)

### Legal Compliance Tools
- [GDPR Checklist (GDPR.eu)](https://gdpr.eu/checklist/)
- [CCPA Compliance Guide (OAIC)](https://oag.ca.gov/privacy/ccpa)

### App Store Policies
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)

---

## 🚨 Important Reminders

1. **Consult a lawyer** - This guide is informational, not legal advice
2. **Keep policies updated** - Review annually or when practices change
3. **Honor user requests** - Respond within required timeframes (30 days GDPR, 45 days CCPA)
4. **Monitor regulations** - Laws evolve, stay informed
5. **Document everything** - Keep records of data practices, consents, and requests

---

**Questions?** Contact a qualified privacy attorney or your legal team.
