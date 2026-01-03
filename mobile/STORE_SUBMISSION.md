# App Store & Google Play Store Submission Guide

This guide provides detailed, step-by-step instructions for submitting the GNB Transfer mobile app to the Apple App Store and Google Play Store.

---

## 📱 Overview

**App Name:** GNB Transfer  
**Bundle Identifier (iOS):** `com.gnbtransfer.app`  
**Package Name (Android):** `com.gnbtransfer.app`  
**Initial Version:** 1.0.0

---

## 🍎 Apple App Store Submission

### Prerequisites

Before you begin:

- [ ] Active Apple Developer account ($99/year)
- [ ] App Store Connect access
- [ ] App created in App Store Connect
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] All assets prepared (icon, screenshots, metadata)

### Step 1: Create App in App Store Connect

1. **Login to App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/)
   - Sign in with your Apple ID

2. **Create New App**
   - Click **My Apps** → **+** button → **New App**
   - Fill in details:
     - **Platform:** iOS
     - **Name:** GNB Transfer
     - **Primary Language:** English (or your primary language)
     - **Bundle ID:** Select `com.gnbtransfer.app`
     - **SKU:** `gnb-transfer-mobile` (unique identifier for your app)
     - **User Access:** Full Access

3. **Click Create**

### Step 2: Prepare App Information

#### General Information

| Field | Value |
|-------|-------|
| App Name | GNB Transfer |
| Subtitle | Airport Transfers & Tours |
| Privacy Policy URL | https://gnbtransfer.com/privacy-policy |

#### Category

- **Primary:** Travel
- **Secondary:** None (or Navigation if desired)

#### Age Rating

Complete the Age Rating questionnaire:
- **Violence:** None
- **Realistic Violence:** No
- **Prolonged Graphic or Sadistic:** No
- **Profanity or Crude Humor:** No
- **Mature/Suggestive Themes:** No
- **Horror/Fear Themes:** No
- **Medical/Treatment Information:** No
- **Alcohol, Tobacco, or Drug Use:** No
- **Gambling & Contests:** No
- **Unrestricted Web Access:** No (app doesn't have a built-in web browser)
- **Gambling & Contests:** No

**Result:** Typically rated **4+** (for all ages)

#### App Information

| Field | Value/Instructions |
|-------|-------------------|
| **Subtitle** | Brief, catchy description (30 characters max) |
| **What's New** | Release notes for this version (4000 chars max) |
| **Promotional Text** | Optional, can update anytime without new release |
| **Description** | Full app description (4000 chars max) |
| **Keywords** | Comma-separated (100 chars max): "transfer,airport,taxi,tour,booking,travel,transportation,shuttle" |
| **Support URL** | https://gnbtransfer.com/support |
| **Marketing URL** | https://gnbtransfer.com (optional) |

#### Description Template

```
GNB Transfer - Your trusted partner for airport transfers and tours in Turkey.

FEATURES:
• Easy booking for airport transfers
• Browse and book exclusive tours
• Multi-language support (9 languages)
• Secure payment processing
• Real-time booking management
• 24/7 customer support

WHY CHOOSE GNB TRANSFER?
✓ Professional, licensed drivers
✓ Modern, comfortable vehicles
✓ Transparent pricing
✓ No hidden fees
✓ Instant booking confirmation

Download GNB Transfer today and experience stress-free travel!

LANGUAGES SUPPORTED:
English, Turkish, Arabic, Russian, German, French, Spanish, Chinese, Farsi

SUPPORT:
Questions? Contact us at support@gnbtransfer.com
Visit: https://gnbtransfer.com
```

### Step 3: Prepare Screenshots

**Required Screenshot Sizes:**

| Device | Resolution | Notes |
|--------|------------|-------|
| iPhone 6.7" (Pro Max) | 1290 × 2796 | **Required** (iPhone 14/15 Pro Max) |
| iPhone 6.5" | 1242 × 2688 | **Required** (iPhone 11/12/13 Pro Max) |
| iPhone 5.5" | 1242 × 2208 | Required (iPhone 8 Plus) |
| iPad Pro 12.9" | 2048 × 2732 | If supporting iPad |

**Minimum:** 3 screenshots per size  
**Maximum:** 10 screenshots per size

**Screenshot Best Practices:**
- Show key app features (booking flow, tours, profile)
- Use actual app content (no mockups)
- Add captions/annotations if helpful
- Ensure readability of text
- Use high-quality images
- Consider A/B testing with App Store Optimization

**Recommended Screenshots:**
1. Home screen with featured destinations
2. Tour listing / browsing
3. Booking flow (showing ease of use)
4. Booking confirmation
5. User profile / account screen

**Tools for Screenshot Generation:**
- Take screenshots on simulators/devices
- Use design tools (Figma, Sketch) for polished frames
- Use screenshot marketing tools (App Launchpad, Previewed)

### Step 4: App Privacy

Apple requires detailed disclosure of data collection practices.

#### Privacy Questionnaire

**Data Collection Summary:**

| Data Type | Collected? | Purpose | Linked to User? |
|-----------|-----------|---------|-----------------|
| Contact Info (Email) | ✅ Yes | Account Creation, Booking | Yes |
| Contact Info (Phone) | ✅ Yes | Booking Contact | Yes |
| Contact Info (Name) | ✅ Yes | Booking Contact | Yes |
| Location (Precise) | ❌ No | Not used | N/A |
| Location (Coarse) | ❌ No | Not used | N/A |
| Photos/Videos | ❌ No | Not used | N/A |
| Device ID | ⚠️ Minimal | Crash Reports (Sentry) | No |
| Crash Data | ✅ Yes | App Stability | No |
| Usage Data | ⚠️ Minimal | Analytics | No |

**Third-Party SDKs:**
- **Sentry:** Crash reporting (anonymized, no PII)
- **Stripe/PayTR:** Payment processing (handled on backend)

**Tracking:**
- [ ] This app uses data for tracking purposes (Select "No" if you don't use tracking)

**Configuration Steps:**

1. In App Store Connect, go to **App Privacy**
2. Click **Get Started**
3. Answer questions based on table above
4. For each "Yes," explain:
   - **Purpose:** Why you collect it (account creation, bookings, crash reports)
   - **Linked to User:** Whether it's tied to user identity
   - **Used for Tracking:** No (unless you implement ad tracking)
5. Review and publish

### Step 5: Build and Submit App

#### Build with EAS

```bash
cd mobile

# Ensure version numbers are set
# Check app.json: version, ios.buildNumber

# Build for App Store
eas build --platform ios --profile production

# Wait for build to complete (~10-20 minutes)
```

#### Submit to App Store Connect

**Option A: Automatic Submission (Recommended)**

```bash
# Submit the latest build
eas submit --platform ios --latest

# Follow prompts for App Store Connect credentials
```

**Option B: Manual Upload**

1. Download `.ipa` file from EAS build dashboard
2. Open **Transporter** app (macOS)
3. Drag and drop `.ipa` file
4. Click **Deliver**
5. Wait for upload to complete

#### Select Build in App Store Connect

1. Go to **App Store** tab
2. Scroll to **Build** section
3. Click **+** to select a build
4. Choose the uploaded build
5. Answer export compliance questions:
   - **Does your app use encryption?** Yes (HTTPS)
   - **Is it exempt?** Yes (standard HTTPS)
6. Click **Done**

### Step 6: Submit for Review

1. Review all sections (ensure no missing fields)
2. Scroll to top and click **Save**
3. Click **Add for Review**
4. Click **Submit to App Review**

#### Answer Review Questions

**Export Compliance:**
- Does your app use encryption? → **Yes** (HTTPS/SSL)
- Is it exempt from US export compliance? → **Yes** (standard HTTPS only)

**Content Rights:**
- I confirm I have the rights to upload this content → **Check**

**Advertising Identifier (IDFA):**
- Does this app use the Advertising Identifier? → **No** (unless you use ads)

**Submit!**

### Step 7: Wait for Review

**Timeline:**
- **Typical:** 24-48 hours
- **Peak times (holidays):** Up to 5 days
- **Expedited review:** Available for critical bug fixes

**Review Status Tracking:**
- **Waiting for Review:** In queue
- **In Review:** Being tested by Apple
- **Pending Developer Release:** Approved, you can release anytime
- **Ready for Sale:** Live on App Store
- **Rejected:** See rejection reason and address issues

**If Rejected:**
1. Read rejection reason carefully
2. Address the issue
3. Respond with explanation in Resolution Center
4. Resubmit

---

## 🤖 Google Play Store Submission

### Prerequisites

Before you begin:

- [ ] Google Play Developer account ($25 one-time fee)
- [ ] Google Play Console access
- [ ] App created in Google Play Console
- [ ] EAS CLI installed
- [ ] All assets prepared (icon, screenshots, metadata)

### Step 1: Create App in Google Play Console

1. **Login to Google Play Console**
   - Go to [play.google.com/console](https://play.google.com/console/)
   - Sign in with your Google account

2. **Create App**
   - Click **Create app**
   - Fill in details:
     - **App name:** GNB Transfer
     - **Default language:** English (United States)
     - **App or game:** App
     - **Free or paid:** Free
   - Accept declarations
   - Click **Create app**

### Step 2: Set Up Store Listing

Navigate to **Store presence** → **Main store listing**

#### App Details

| Field | Value |
|-------|-------|
| **App name** | GNB Transfer |
| **Short description** | Airport transfers & tours booking (80 chars max) |
| **Full description** | See template below (4000 chars max) |

#### Full Description Template

```
GNB Transfer - Your trusted partner for airport transfers and tours in Turkey

🚗 AIRPORT TRANSFERS
Book reliable airport transfers in minutes. Professional drivers, comfortable vehicles, transparent pricing.

🗺️ EXCLUSIVE TOURS
Discover unique tours and experiences. Expertly curated destinations, multilingual guides.

✨ KEY FEATURES
• Easy booking process
• Multi-language support (9 languages)
• Secure payments via Stripe
• Real-time booking tracking
• 24/7 customer support
• Instant confirmation

🌟 WHY CHOOSE US?
✓ Licensed professional drivers
✓ Modern, well-maintained vehicles
✓ No hidden fees
✓ Flexible cancellation policy
✓ Local expertise

📱 AVAILABLE IN 9 LANGUAGES
English, Turkish, Arabic, Russian, German, French, Spanish, Chinese, Farsi

💬 CUSTOMER SUPPORT
Email: support@gnbtransfer.com
Website: https://gnbtransfer.com

Download GNB Transfer today and experience stress-free travel!
```

#### Graphics Assets

| Asset | Size | Required | Notes |
|-------|------|----------|-------|
| **App icon** | 512 × 512 | ✅ Yes | PNG, 32-bit, no alpha |
| **Feature graphic** | 1024 × 500 | ✅ Yes | JPG or PNG, showcases app |
| **Phone screenshots** | Various | ✅ Yes | 2-8 screenshots, see below |
| **7-inch tablet** | Various | ❌ Optional | If supporting tablets |
| **10-inch tablet** | Various | ❌ Optional | If supporting tablets |

**Phone Screenshot Requirements:**
- **Minimum:** 320px on shortest side
- **Maximum:** 3840px on longest side
- **Recommended:** 1080 × 1920 (portrait) or 1920 × 1080 (landscape)
- **Quantity:** 2-8 screenshots
- **Format:** PNG or JPEG (no alpha channel)

**Feature Graphic Tips:**
- Showcase app name and key benefit
- Use brand colors
- Ensure text is readable at small sizes
- No device frames in feature graphic

#### Contact Details

| Field | Value |
|-------|-------|
| **Email** | support@gnbtransfer.com |
| **Phone** | Optional (customer support number) |
| **Website** | https://gnbtransfer.com |

#### Categorization

- **App category:** Travel & Local
- **Tags:** (optional) travel, transportation, booking, tours

#### Click Save Draft

### Step 3: Set Up Data Safety

Navigate to **Policy** → **Data safety**

This section discloses what data your app collects and how it's used.

#### Data Collection Summary

**Data types collected:**

| Category | Data Type | Collected? | Purpose | Shared? | Optional? |
|----------|-----------|-----------|---------|---------|-----------|
| **Personal Info** | Name | Yes | Bookings, Account | No | No |
| **Personal Info** | Email | Yes | Account, Support | No | No |
| **Personal Info** | Phone | Yes | Bookings, Contact | No | No |
| **Location** | Precise | No | N/A | N/A | N/A |
| **Location** | Approximate | No | N/A | N/A | N/A |
| **Photos** | Photos | No | N/A | N/A | N/A |
| **Device ID** | Device ID | Minimal | Crash Reports | Yes (Sentry) | No |
| **App Info** | Crash logs | Yes | Stability | Yes (Sentry) | No |

**Fill out Data Safety form:**

1. **Data collection and security**
   - "Does your app collect or share user data?" → **Yes**

2. **Data types**
   - Select: Name, Email address, Phone number
   - Select: App interactions (crash logs)
   - Device or other IDs (for crash reporting)

3. **Data usage and handling**
   For each data type:
   - **Collected:** Yes
   - **Shared:** Only Device IDs (with Sentry for crashes)
   - **Ephemeral:** No
   - **Required or Optional:** Required (for core functionality)
   - **Data usage:** Account management, App functionality
   - **Data security:** Data is encrypted in transit (HTTPS)

4. **Privacy policy**
   - Enter URL: `https://gnbtransfer.com/privacy-policy`

5. Click **Save**

### Step 4: Content Rating

Navigate to **Policy** → **App content** → **Content rating**

1. **Select rating authority:** IARC
2. **Fill out questionnaire:**
   - Violence: No
   - Sexual content: No
   - Language: No
   - Controlled substances: No
   - Gambling: No
   - User interaction: No (no chat, no user-generated content)
   - Shares user location: No
   - Unrestricted internet: No

3. **Review ratings:**
   - ESRB: Everyone
   - PEGI: 3
   - USK: All ages
   - etc.

4. **Apply rating**

### Step 5: Target Audience & Content

#### Target Audience

Navigate to **Policy** → **App content** → **Target audience**

1. **Target age group:**
   - Select: 18 and over (or your actual target audience)
   - If under 13, additional policies apply (COPPA)

2. **Store presence:**
   - Is your app designed specifically for children? → **No**

#### COVID-19 Contact Tracing

- Does your app qualify as a COVID-19 contact tracing or status app? → **No**

#### Data Safety Acknowledgment

- Review and confirm data safety declarations

### Step 6: Build and Upload App

#### Build with EAS

```bash
cd mobile

# Ensure version numbers are set
# Check app.json: version, android.versionCode

# Build for Google Play (AAB format)
eas build --platform android --profile production

# Wait for build to complete (~10-20 minutes)
```

#### Submit to Google Play Console

**Option A: Automatic Submission (Recommended)**

```bash
# Submit the latest build
eas submit --platform android --latest

# Follow prompts for Google Play service account JSON
```

**Option B: Manual Upload**

1. Download `.aab` file from EAS build dashboard
2. Go to **Production** → **Releases** → **Create new release**
3. Click **Upload** and select your `.aab` file
4. Fill in release notes (What's new in this release)
5. Click **Save**

### Step 7: Create Production Release

1. **Navigate to Production**
   - Go to **Production** → **Releases**

2. **Create new release**
   - Click **Create new release**

3. **Upload bundle**
   - Upload your `.aab` file (or it's already uploaded via `eas submit`)

4. **Release name**
   - Auto-generated based on version code (e.g., "1 (1.0.0)")

5. **Release notes** (What's new)
   ```
   Initial release of GNB Transfer mobile app!

   Features:
   • Book airport transfers with ease
   • Browse and book exclusive tours
   • Manage your bookings on the go
   • Multi-language support (9 languages)
   • Secure payment processing
   • 24/7 customer support

   We're excited to bring GNB Transfer to your mobile device!
   ```

6. **Review release**
   - Click **Review release**
   - Ensure all warnings/errors are addressed

7. **Rollout percentage** (optional)
   - Start with 100% for full release
   - Or start with 10-20% for staged rollout

8. **Start rollout to Production**
   - Click button to submit

### Step 8: Review and Approval

**Timeline:**
- **Typical:** Few hours to 1-2 days
- **First release:** May take longer (additional review)

**Review Status:**
- Check **Publishing overview** for status
- Once approved, app goes live automatically (unless using staged rollout)

**If Rejected/Changes Requested:**
1. Check **Publishing overview** for messages
2. Address the issue
3. Upload new build with changes
4. Resubmit

---

## 📋 Asset Preparation Checklist

### App Icon

- [ ] **Size:** 1024 × 1024 pixels
- [ ] **Format:** PNG (iOS), PNG 32-bit (Android)
- [ ] **No alpha channel** (iOS requirement)
- [ ] **No rounded corners** (system applies automatically)
- [ ] **Recognizable at small sizes**
- [ ] **Consistent with brand**

**Location:**
- iOS: `mobile/assets/icon.png`
- Android: `mobile/assets/icon.png` (same file)

### Adaptive Icon (Android)

- [ ] **Size:** 1024 × 1024 pixels
- [ ] **Format:** PNG with transparency
- [ ] **Safe area:** Center 66% (circle) contains key elements
- [ ] **Background color:** Set in `app.json` → `android.adaptiveIcon.backgroundColor`

**Location:** `mobile/assets/adaptive-icon.png`

### Splash Screen

- [ ] **Logo/Icon:** Centered, transparent background
- [ ] **Size:** At least 1242 × 2436 (scales to all sizes)
- [ ] **Format:** PNG with transparency
- [ ] **Background color:** Set in `app.json` → `splash.backgroundColor`

**Location:** `mobile/assets/splash-icon.png`

### Screenshots

#### iOS

Device sizes to capture:
- [ ] iPhone 6.7" (Pro Max): 1290 × 2796
- [ ] iPhone 6.5": 1242 × 2688
- [ ] iPhone 5.5": 1242 × 2208
- [ ] iPad Pro 12.9" (optional): 2048 × 2732

#### Android

Device sizes to capture:
- [ ] Phone: 1080 × 1920 (or higher)
- [ ] 7" Tablet (optional): 1200 × 1920
- [ ] 10" Tablet (optional): 1800 × 2560

### Feature Graphic (Android)

- [ ] **Size:** 1024 × 500 pixels
- [ ] **Format:** JPG or PNG (no alpha)
- [ ] **Content:** App name, key benefit, brand colors
- [ ] **Text readability:** Ensure legible at small sizes

---

## 🔐 Privacy Policy & Terms of Service

Both stores require publicly accessible legal documents.

### Requirements

| Document | Required By | URL Format |
|----------|-------------|------------|
| **Privacy Policy** | Both | `https://gnbtransfer.com/privacy-policy` |
| **Terms of Service** | Apple (recommended), Google | `https://gnbtransfer.com/terms-of-service` |

### Privacy Policy Must Include

1. **Data collection:** What data you collect (email, name, phone, crash logs)
2. **Data usage:** How you use the data (bookings, support, app improvement)
3. **Third-party services:** Sentry (crash reporting), Stripe/PayTR (payments)
4. **Data sharing:** With whom data is shared
5. **User rights:** How users can access, delete, or correct their data (GDPR)
6. **Data retention:** How long data is kept
7. **Contact information:** How to contact you about privacy concerns

### Terms of Service Should Include

1. **Service description:** What the app provides
2. **User responsibilities:** Accurate information, proper use
3. **Payment terms:** Booking payments, refunds, cancellations
4. **Liability limitations:** Disclaimers
5. **Termination:** How accounts can be terminated
6. **Dispute resolution:** How disputes are handled

### Template Privacy Policy Generators

- [Termly](https://termly.io/products/privacy-policy-generator/)
- [PrivacyPolicies.com](https://www.privacypolicies.com/privacy-policy-generator/)
- [Freeprivacypolicy.com](https://www.freeprivacypolicy.com/)

**⚠️ Important:** Have a legal professional review your privacy policy and terms to ensure compliance with local laws (GDPR, CCPA, etc.).

---

## 🚀 Post-Submission Checklist

After submitting to both stores:

### Immediate Actions

- [ ] Monitor email for store communications
- [ ] Check App Store Connect for review status
- [ ] Check Google Play Console for review status
- [ ] Prepare support resources (FAQs, help docs)
- [ ] Set up crash monitoring (Sentry configured)

### First Week After Launch

- [ ] Monitor app store reviews daily
- [ ] Respond to negative reviews professionally
- [ ] Check Sentry for crash reports
- [ ] Monitor user feedback emails
- [ ] Track installation metrics
- [ ] Test download and installation on fresh devices

### App Store Optimization (ASO)

- [ ] Monitor keyword rankings
- [ ] A/B test screenshots (if using ASO tools)
- [ ] Update description based on user feedback
- [ ] Encourage satisfied users to leave reviews
- [ ] Respond to reviews (especially negative ones)

---

## 🆘 Troubleshooting Common Issues

### iOS Submission Errors

**"Invalid Bundle" Error**
- Ensure `ios.bundleIdentifier` matches App Store Connect
- Verify build was created with production profile
- Check for missing app icon or launch screen

**"Missing Compliance" Error**
- Declare encryption usage in App Store Connect
- Standard HTTPS is exempt from export compliance

**"Guideline 2.1 - Performance - App Completeness"**
- App crashes or doesn't work properly
- Test thoroughly before submitting
- Check network connectivity and API endpoints

### Android Submission Errors

**"Upload failed: Duplicate version code"**
- Increment `android.versionCode` in `app.json`
- Rebuild and resubmit

**"Missing Privacy Policy"**
- Add privacy policy URL to Data Safety section
- Ensure URL is publicly accessible

**"Invalid package name"**
- Verify `android.package` matches Google Play Console
- Package name cannot be changed after first upload

---

## 📞 Support Resources

### Apple

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Contact App Review Team](https://developer.apple.com/contact/app-store/)

### Google

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Developer Policy Center](https://play.google.com/about/developer-content-policy/)
- [Material Design Guidelines](https://material.io/design)
- [Contact Google Play Support](https://support.google.com/googleplay/android-developer/answer/7218994)

### Expo

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://chat.expo.dev/)

---

**Ready to submit?** Follow the steps above carefully and your app will be live in no time! 🚀
