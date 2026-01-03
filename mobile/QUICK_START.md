# Mobile App Store Submission - Quick Start

This document provides a quick overview of what's been done and what needs to be done to submit the GNB Transfer mobile app to the Apple App Store and Google Play Store.

---

## ✅ What's Already Done

All technical configuration and documentation for app store submission is complete:

### Configuration (✅ Complete)

1. **app.json** - All required metadata configured:
   - App name, bundle identifiers, version numbers
   - OTA updates with appVersion-based runtimeVersion
   - iOS and Android specific settings
   - No special permissions requested
   - Legal URLs placeholders

2. **eas.json** - Build profiles ready:
   - Development profile for local testing
   - Preview profile for TestFlight/internal testing
   - Production profile for store releases
   - Environment variables configured per profile

3. **Sentry** - Free-tier safe crash reporting:
   - Production-only (disabled in dev)
   - No performance tracing
   - No session tracking
   - Privacy-safe breadcrumb filtering

4. **Environment Variables** - Documented in .env.example:
   - API URL configuration
   - Sentry DSN (optional)
   - Clear usage instructions

### Documentation (✅ Complete)

Comprehensive guides created for the release process:

| Document | Purpose | Lines |
|----------|---------|-------|
| **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** | Complete release process from versioning to store submission | 655 |
| **[STORE_SUBMISSION.md](./STORE_SUBMISSION.md)** | Step-by-step App Store and Play Store submission | 766 |
| **[OTA_UPDATES.md](./OTA_UPDATES.md)** | Safe over-the-air update procedures | 612 |
| **[PRIVACY_LEGAL.md](./PRIVACY_LEGAL.md)** | GDPR/CCPA compliance and legal requirements | 605 |
| **[ASSETS_CHECKLIST.md](./ASSETS_CHECKLIST.md)** | Complete asset specifications and requirements | 573 |
| **[README.md](./README.md)** | Main documentation with setup and features | 900 |

**Total:** 4,111 lines of comprehensive documentation

---

## 📋 What Needs to Be Done (Manual Work)

The following items **cannot be automated** and require manual work before submission:

### 1. Create Visual Assets 🎨

**App Icons:**
- [ ] Design and create 1024×1024 app icon (no transparency for iOS)
- [ ] Save to `mobile/assets/icon.png`
- [ ] Create Android adaptive icon variant (with transparency)
- [ ] Save to `mobile/assets/adaptive-icon.png`

**Splash Screen:**
- [ ] Design splash screen logo/icon
- [ ] Save as transparent PNG to `mobile/assets/splash-icon.png`

**Screenshots (see [ASSETS_CHECKLIST.md](./ASSETS_CHECKLIST.md)):**
- [ ] Capture 3-10 screenshots on iOS (6.7", 6.5", 5.5" sizes)
- [ ] Capture 2-8 screenshots on Android (1080×1920)
- [ ] Add text overlays explaining features (optional but recommended)
- [ ] Save to `mobile/screenshots/ios/` and `mobile/screenshots/android/`

**Feature Graphic (Google Play only):**
- [ ] Create 1024×500 banner image with app name and key benefit
- [ ] Save to `mobile/screenshots/feature-graphic.png`

**Estimated Time:** 4-8 hours (with designer)  
**Resources:** See [ASSETS_CHECKLIST.md](./ASSETS_CHECKLIST.md) for tools and templates

### 2. Create Legal Documents 📜

**Privacy Policy:**
- [ ] Write privacy policy covering:
  - Data collection (name, email, phone, crash logs)
  - Third-party services (Sentry, Stripe/PayTR)
  - User rights (GDPR/CCPA)
  - Contact information
- [ ] Host at `https://gnbtransfer.com/privacy-policy`
- [ ] Update URL in `app.json` → `expo.extra.privacyPolicyUrl`

**Terms of Service:**
- [ ] Write terms of service covering:
  - Service description
  - Booking and payment terms
  - Cancellation policy
  - Liability limitations
- [ ] Host at `https://gnbtransfer.com/terms-of-service`
- [ ] Update URL in `app.json` → `expo.extra.termsOfServiceUrl`

**Estimated Time:** 4-8 hours (or use template generators)  
**Resources:** See [PRIVACY_LEGAL.md](./PRIVACY_LEGAL.md) for templates and requirements

### 3. Set Up Store Accounts 🏪

**Apple Developer Account:**
- [ ] Purchase Apple Developer membership ($99/year)
- [ ] Create app in App Store Connect
- [ ] Configure App Store Connect API key (for EAS Submit)

**Google Play Developer Account:**
- [ ] Purchase Google Play Developer account ($25 one-time)
- [ ] Create app in Google Play Console
- [ ] Generate service account JSON key (for EAS Submit)

**Estimated Time:** 1-2 hours  
**Resources:** See [STORE_SUBMISSION.md](./STORE_SUBMISSION.md) for step-by-step guides

### 4. First Build and Test 🔨

**Development Testing:**
- [ ] Test app thoroughly on iOS simulator
- [ ] Test app thoroughly on Android emulator
- [ ] Test on physical devices (iPhone and Android)
- [ ] Verify all critical user flows work

**TestFlight / Internal Testing:**
- [ ] Build preview version: `eas build --profile preview --platform ios`
- [ ] Distribute to internal testers via TestFlight
- [ ] Build preview APK: `eas build --profile preview --platform android`
- [ ] Distribute to internal testers
- [ ] Gather feedback and fix issues

**Estimated Time:** 1-2 days  
**Resources:** See [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) for build commands

### 5. Store Submission 🚀

**Complete Store Listings:**
- [ ] Fill in App Store Connect metadata (description, keywords, screenshots)
- [ ] Complete App Privacy labels (Apple)
- [ ] Fill in Google Play Console metadata
- [ ] Complete Data Safety section (Google)

**Submit for Review:**
- [ ] Build production version: `eas build --profile production --platform all`
- [ ] Submit to App Store: `eas submit --platform ios --latest`
- [ ] Submit to Google Play: `eas submit --platform android --latest`
- [ ] Wait for review (24-48 hours for Apple, few hours for Google)

**Estimated Time:** 4-8 hours (first submission)  
**Resources:** See [STORE_SUBMISSION.md](./STORE_SUBMISSION.md) for complete checklists

---

## 🎯 Recommended Order of Execution

Follow this order for the smoothest experience:

### Week 1: Assets and Legal
1. **Day 1-2:** Create app icon, splash screen, adaptive icon
2. **Day 3-4:** Capture and design screenshots
3. **Day 5:** Write Privacy Policy and Terms of Service
4. **Day 6-7:** Host legal documents on website

### Week 2: Accounts and Testing
1. **Day 1:** Set up Apple Developer and Google Play Developer accounts
2. **Day 2:** Create apps in App Store Connect and Play Console
3. **Day 3-4:** Build preview versions and test with team
4. **Day 5-7:** Fix bugs found during testing

### Week 3: Submission
1. **Day 1-2:** Complete store listing metadata
2. **Day 3:** Build production versions
3. **Day 4:** Submit to both stores
4. **Day 5-7:** Respond to review feedback if needed

**Total Estimated Time:** 2-3 weeks from start to store approval

---

## 📚 Documentation Map

Not sure where to start? Use this guide:

**First Time Submitting?**
→ Start with [STORE_SUBMISSION.md](./STORE_SUBMISSION.md)

**Need to Create Assets?**
→ Read [ASSETS_CHECKLIST.md](./ASSETS_CHECKLIST.md)

**Ready to Build and Release?**
→ Follow [RELEASE_GUIDE.md](./RELEASE_GUIDE.md)

**Want to Push Updates After Release?**
→ Read [OTA_UPDATES.md](./OTA_UPDATES.md)

**Need to Write Privacy Policy?**
→ See [PRIVACY_LEGAL.md](./PRIVACY_LEGAL.md)

**General App Information?**
→ Check [README.md](./README.md)

---

## 🚨 Common Mistakes to Avoid

Based on the comprehensive documentation, here are the top mistakes to avoid:

1. **❌ Changing version number for OTA updates**
   - OTA updates must keep the same version as the published app
   - Only increment version for new store releases

2. **❌ Forgetting to increment build numbers**
   - iOS `buildNumber` must increase for every App Store upload
   - Android `versionCode` must increase for every Play Store upload

3. **❌ Using OTA for native code changes**
   - OTA is for JavaScript-only changes
   - Native module updates require full store release

4. **❌ Skipping TestFlight/internal testing**
   - Always test with preview builds before production
   - Catch bugs before they reach end users

5. **❌ Not having legal documents ready**
   - Privacy Policy is required by both stores
   - Host it publicly before submission

6. **❌ Low-quality screenshots**
   - Screenshots are your primary marketing tool
   - Invest time in creating polished, informative screenshots

7. **❌ Requesting unnecessary permissions**
   - Only request permissions you actually need
   - App currently requests no special permissions (good!)

8. **❌ Using paid Sentry features**
   - Current config is free-tier safe
   - Don't enable tracing or session tracking

---

## 🔍 Quick Configuration Verification

Before submission, verify these key configuration items:

### app.json Checklist

```bash
cd mobile
cat app.json | grep -E "version|buildNumber|versionCode|bundleIdentifier|package"
```

Should show:
- ✅ `"version": "1.0.0"` (or your current version)
- ✅ `"buildNumber": "1"` (or higher for subsequent builds)
- ✅ `"versionCode": 1` (or higher for subsequent builds)
- ✅ `"bundleIdentifier": "com.gnbtransfer.app"`
- ✅ `"package": "com.gnbtransfer.app"`

### eas.json Checklist

```bash
cat eas.json | jq '.build'
```

Should show three profiles:
- ✅ `development` with `developmentClient: true`
- ✅ `preview` with `distribution: "internal"`
- ✅ `production` with production API URL

### Sentry Checklist

```bash
grep "tracesSampleRate\|autoSessionTracking" sentry.ts
```

Should show:
- ✅ `tracesSampleRate: 0` (no performance monitoring)
- ✅ `autoSessionTracking: false` (no session tracking)

---

## 💡 Pro Tips

1. **Use Preview Builds First**
   - Always test with `eas build --profile preview` before production
   - Catch issues early with TestFlight/internal testing

2. **Document Version History**
   - Keep a CHANGELOG.md with release notes
   - Makes it easier to write "What's New" for stores

3. **Monitor After Release**
   - Watch Sentry for crash spikes
   - Respond to negative reviews quickly
   - Track installation metrics

4. **Plan OTA Updates Carefully**
   - Only use for minor bug fixes
   - Test OTA updates on preview channel first
   - Have rollback plan ready

5. **Keep Legal Docs Updated**
   - Review privacy policy annually
   - Update when you add new features or services
   - Document all third-party integrations

---

## 📞 Get Help

**Technical Issues:**
- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://chat.expo.dev/)

**Store Policies:**
- [Apple Developer Support](https://developer.apple.com/support/)
- [Google Play Developer Support](https://support.google.com/googleplay/android-developer/)

**Privacy/Legal:**
- Consult a qualified attorney for legal compliance

---

## 🎉 Summary

**What's Done:**
- ✅ All technical configuration complete
- ✅ All build profiles ready
- ✅ 4,000+ lines of comprehensive documentation
- ✅ Free-tier compliant tooling
- ✅ Safe OTA update configuration

**What's Next:**
- 📋 Create visual assets (icons, screenshots)
- 📋 Write and host legal documents
- 📋 Set up store accounts
- 📋 Test and submit

**Time to Market:** 2-3 weeks from now

You're ready to go! Follow the guides, complete the manual steps, and your app will be in the stores soon. 🚀

---

**Questions?** Refer to the detailed guides listed above or contact the development team.
