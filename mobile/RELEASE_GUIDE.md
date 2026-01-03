# GNB Transfer Mobile App - Release Guide

This guide provides step-by-step instructions for releasing the mobile app to the App Store and Google Play Store.

---

## 📋 Pre-Release Checklist

Before starting any release process, ensure all of the following are complete:

### Technical Requirements

- [ ] All features tested on both iOS and Android
- [ ] All automated tests passing
- [ ] No critical bugs or crashes
- [ ] App tested on physical devices (not just simulators)
- [ ] Performance is acceptable (no lag, crashes, memory leaks)
- [ ] Offline mode tested and working
- [ ] Network error handling verified
- [ ] All API endpoints returning expected data
- [ ] Authentication flow working correctly
- [ ] Deep linking tested (if applicable)

### Assets & Content

- [ ] App icon (1024×1024px) finalized and added to `assets/icon.png`
- [ ] Splash screen image finalized and added to `assets/splash-icon.png`
- [ ] Adaptive icon (Android) finalized and added to `assets/adaptive-icon.png`
- [ ] All translations complete and reviewed
- [ ] In-app text reviewed for typos and clarity

### Legal & Compliance

- [ ] Privacy Policy published at `https://gnbtransfer.com/privacy-policy`
- [ ] Terms of Service published at `https://gnbtransfer.com/terms-of-service`
- [ ] Legal URLs updated in `app.json` → `expo.extra`
- [ ] App complies with GDPR/CCPA requirements
- [ ] Third-party service agreements reviewed (Sentry, Stripe/PayTR)

### Store Accounts

- [ ] Apple Developer account active ($99/year)
- [ ] Google Play Developer account active ($25 one-time)
- [ ] App Store Connect access configured
- [ ] Google Play Console access configured
- [ ] Team members have appropriate access levels

---

## 🔢 Version Number Strategy

Understanding version numbers is critical for successful releases.

### Version Components

| Component | Location | Format | When to Increment |
|-----------|----------|--------|-------------------|
| **version** | `app.json` → `expo.version` | Semver (e.g., `1.0.0`) | User-facing changes, new features |
| **buildNumber** (iOS) | `app.json` → `expo.ios.buildNumber` | String integer (e.g., `"1"`) | **Every** App Store upload |
| **versionCode** (Android) | `app.json` → `expo.android.versionCode` | Integer (e.g., `1`) | **Every** Play Store upload |

### Versioning Examples

**Initial Release:**
```json
{
  "version": "1.0.0",
  "ios": { "buildNumber": "1" },
  "android": { "versionCode": 1 }
}
```

**Bug Fix Release (Patch):**
```json
{
  "version": "1.0.1",
  "ios": { "buildNumber": "2" },
  "android": { "versionCode": 2 }
}
```

**New Feature Release (Minor):**
```json
{
  "version": "1.1.0",
  "ios": { "buildNumber": "3" },
  "android": { "versionCode": 3 }
}
```

**Major Release (Breaking Changes):**
```json
{
  "version": "2.0.0",
  "ios": { "buildNumber": "4" },
  "android": { "versionCode": 4 }
}
```

**Multiple TestFlight Builds (Same Version):**
```json
// First TestFlight build
{ "version": "1.2.0", "buildNumber": "10" }

// Fix found in TestFlight, new build
{ "version": "1.2.0", "buildNumber": "11" }

// Final production build
{ "version": "1.2.0", "buildNumber": "12" }
```

### Important Rules

1. **NEVER reuse a build number** for the same version
2. **Build numbers must always increase** (iOS) - they're cumulative
3. **Version codes must always increase** (Android) - they're monotonic
4. **Semantic versioning** for user-visible changes: `MAJOR.MINOR.PATCH`

---

## 🚀 Release Process

### Step 1: Prepare the Release

#### 1.1 Update Version Numbers

Edit `mobile/app.json`:

```bash
cd mobile
```

Update the version fields:
- Increment `version` based on changes (1.0.0 → 1.0.1, 1.1.0, or 2.0.0)
- Increment `ios.buildNumber` (must always increase)
- Increment `android.versionCode` (must always increase)

#### 1.2 Update Changelog

Document what's new in this release (create `CHANGELOG.md` if it doesn't exist):

```markdown
## [1.0.1] - 2026-01-15

### Fixed
- Fixed booking confirmation not showing correct dates
- Fixed crash on profile screen for users without phone numbers

### Improved
- Performance improvements for tour listing
- Better error messages for network failures
```

#### 1.3 Test Everything

```bash
# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Test on physical devices via Expo Go or development build
npm start
```

Verify:
- All critical user flows work
- No crashes or freezes
- Network errors handled gracefully
- Offline mode works correctly

#### 1.4 Commit Version Changes

```bash
git add app.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.1"
git push origin main
```

---

### Step 2: Build for iOS (App Store)

#### 2.1 Create Production Build

```bash
cd mobile

# Login to EAS if not already logged in
eas login

# Build for iOS (App Store distribution)
eas build --platform ios --profile production
```

This will:
- Bundle your JavaScript code
- Compile native iOS code
- Generate an `.ipa` file
- Upload build to EAS servers

**Build time:** ~10-20 minutes

#### 2.2 Download or Auto-Submit

**Option A: Download and submit manually**
```bash
# Download the .ipa file
eas build:list --platform ios --limit 1
# Follow the download link in the output
```

**Option B: Auto-submit to App Store Connect (Recommended)**
```bash
# Submit directly from EAS
eas submit --platform ios --latest

# Or submit a specific build
eas submit --platform ios --id <build-id>
```

**Required for auto-submit:**
- App Store Connect API Key or app-specific password
- App already created in App Store Connect
- Configured in `eas.json` or provided interactively

---

### Step 3: Build for Android (Google Play)

#### 3.1 Create Production Build

```bash
cd mobile

# Build for Android (AAB for Play Store)
eas build --platform android --profile production
```

This will generate an `.aab` (Android App Bundle) file.

**Build time:** ~10-20 minutes

#### 3.2 Download or Auto-Submit

**Option A: Download and submit manually**
```bash
# Download the .aab file
eas build:list --platform android --limit 1
# Follow the download link in the output
```

**Option B: Auto-submit to Google Play Console (Recommended)**
```bash
# Submit directly from EAS
eas submit --platform android --latest

# Or submit a specific build
eas submit --platform android --id <build-id>
```

**Required for auto-submit:**
- Google Play service account JSON key
- App already created in Google Play Console
- Configured in `eas.json` or provided interactively

---

### Step 4: Submit to App Store (iOS)

If you manually downloaded the `.ipa`:

#### 4.1 Upload to App Store Connect

Use Transporter app (macOS) or Application Loader:

1. Open **Transporter** app (download from Mac App Store)
2. Drag and drop your `.ipa` file
3. Click **Deliver**
4. Wait for upload to complete

#### 4.2 Complete App Store Connect Metadata

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app → **App Store** tab
3. Click **+ Version** or select existing version
4. Fill in required fields:
   - **What's New in This Version** (release notes)
   - **Promotional Text** (optional, can be updated without new release)
   - **Description**
   - **Keywords** (comma-separated, max 100 characters)
   - **Support URL**
   - **Marketing URL** (optional)
   - **Screenshots** (at least 3 for each required device size)
   - **App Privacy** (data collection disclosure)
5. Select the uploaded build
6. Click **Save** then **Submit for Review**

#### 4.3 Answer App Review Questions

- **Export Compliance:** If app uses encryption (HTTPS), you may need to declare
- **Advertising Identifier:** Select "No" if not using ads
- **Content Rights:** Confirm you have rights to all content

#### 4.4 Submit

Click **Submit for Review**. Apple will review your app (typically 24-48 hours).

---

### Step 5: Submit to Google Play (Android)

If you manually downloaded the `.aab`:

#### 5.1 Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app
3. Go to **Production** → **Releases** → **Create new release**
4. Upload your `.aab` file
5. Fill in release notes (what's new)
6. Click **Review release**

#### 5.2 Complete Store Listing (First Release Only)

If this is your first release, complete the store listing:

1. **Main Store Listing**
   - App name
   - Short description (80 characters max)
   - Full description (4000 characters max)
   - Screenshots (2-8 per device type)
   - App icon
   - Feature graphic (1024×500px)
   - Privacy Policy URL

2. **Content Rating**
   - Complete the questionnaire
   - Receive rating (e.g., Everyone, Teen, Mature)

3. **Target Audience**
   - Select target age groups
   - Declare if app is for children

4. **Data Safety**
   - Declare what data is collected
   - How data is used (analytics, functionality, etc.)
   - Data sharing practices

5. **App Content**
   - COVID-19 contact tracing (if applicable)
   - Data safety declarations
   - Government apps (if applicable)

#### 5.3 Submit for Review

1. Review all sections (must be complete)
2. Click **Start rollout to Production**
3. Confirm rollout

**Review time:** Typically a few hours to 1-2 days.

---

## 📱 TestFlight & Internal Testing

Before submitting to production, always test with real users via TestFlight (iOS) or internal testing (Android).

### TestFlight (iOS)

#### Build for TestFlight

```bash
cd mobile
eas build --platform ios --profile preview
```

Or use production profile and submit to TestFlight before releasing:

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

Then in App Store Connect:
1. Go to **TestFlight** tab
2. Select the build
3. Add internal testers (up to 100, no review required)
4. Or add external testers (requires brief Apple review, up to 10,000 testers)

#### Invite Testers

Internal testers:
- Add email addresses in App Store Connect
- Testers receive email with TestFlight invitation
- They download TestFlight app and install your build

### Google Play Internal Testing (Android)

#### Build for Internal Testing

```bash
cd mobile
eas build --platform android --profile preview
```

Then upload to Google Play Console:

1. Go to **Internal testing** → **Releases**
2. Create new release
3. Upload `.aab` file
4. Add release notes
5. Save and review

#### Invite Testers

1. Create internal testing group
2. Add tester email addresses (up to 100)
3. Testers receive email with opt-in link
4. They download from Play Store (internal track)

---

## 🔄 OTA Updates (Post-Release)

After your app is live, you can push **safe, non-breaking** updates using Expo's OTA system without going through app store review.

### What's Safe for OTA

✅ **Allowed:**
- Bug fixes (logic errors, crashes)
- Text/copy changes (typos, updated wording)
- Minor UI tweaks (colors, spacing, button sizes)
- Translation updates
- Performance improvements (JavaScript optimizations)

⛔ **NOT Allowed (Requires Store Release):**
- Navigation structure changes
- Authentication flow modifications
- New permissions
- Native module additions/updates
- Data model changes that affect API contracts
- Breaking changes to user flows
- Significant new features

### Publishing an OTA Update

#### 1. Make JS-Only Changes

Edit your code (e.g., fix a typo, adjust colors, fix a bug).

#### 2. Ensure Version Matches

**DO NOT change version number** in `app.json` for OTA updates. The version must match the published app version.

```json
// app.json - Keep this the SAME as published version
{
  "version": "1.0.0"  // Don't change this!
}
```

#### 3. Publish the Update

```bash
cd mobile

# Publish to production channel
eas update --branch production --message "Fix typo in booking confirmation"

# Or for a specific platform
eas update --branch production --platform ios --message "Fix iOS-specific crash"
```

#### 4. Verify Update Published

```bash
# View recent updates
eas update:list --branch production
```

#### 5. Users Receive Update

Users will receive the update:
- **When:** Next time they open the app (if `checkAutomatically: "ON_LOAD"`)
- **How:** Automatically downloaded in the background
- **Compatibility:** Only delivered to users with matching `runtimeVersion` (same app version)

### OTA Update Best Practices

1. **Test before publishing:** Test OTA updates on preview builds first
2. **Monitor error rates:** Use Sentry to watch for errors after OTA release
3. **Small, incremental updates:** Don't combine many changes in one OTA update
4. **Rollback if needed:** Publish a previous working bundle if issues arise
5. **Communication:** Document what was changed (internal changelog)
6. **Never bypass review:** Don't use OTA to sneak features past app store review

### Rollback an OTA Update

If an OTA update causes issues:

```bash
# Republish the previous working branch
eas update --branch production --message "Rollback to stable version"
```

Or create a new branch with the previous working code and publish it.

---

## 🚨 Emergency Procedures

### Critical Bug in Production

If a critical bug is discovered in production:

#### Option 1: OTA Update (If Bug is JS-Only)

```bash
# Fix the bug in your code
# Test the fix thoroughly
cd mobile
eas update --branch production --message "HOTFIX: Critical bug fix"
```

Users will receive the fix within minutes to hours.

#### Option 2: Emergency Store Release (If Native Code Affected)

1. Fix the bug
2. Increment `buildNumber` (iOS) and `versionCode` (Android)
3. Optionally increment `version` (1.0.0 → 1.0.1)
4. Build and submit:
   ```bash
   eas build --platform all --profile production
   eas submit --platform all --latest
   ```
5. Request expedited review:
   - **iOS:** In App Store Connect, select "Expedited Review" and explain the critical issue
   - **Android:** Google Play reviews are typically fast (hours), no special request needed

### App Rejection

If your app is rejected by Apple or Google:

1. **Read rejection reason carefully** in App Store Connect or Play Console
2. **Address the specific issue** mentioned
3. **Update app if needed** (code, screenshots, metadata, etc.)
4. **Respond to reviewer** with explanation of changes
5. **Resubmit** for review

Common rejection reasons:
- Missing privacy policy
- Incomplete app functionality
- Crashes during review
- Misleading screenshots or description
- Using private APIs (iOS)
- Requesting unnecessary permissions

---

## 📊 Post-Release Monitoring

After release, monitor your app's health:

### Error Tracking (Sentry)

1. Check Sentry dashboard for crash reports
2. Set up alerts for error spikes
3. Monitor error trends over time

### App Analytics

Use App Store Connect Analytics and Google Play Console to track:
- Installations
- Crashes
- User retention
- In-app events (if configured)

### User Feedback

Monitor:
- App Store reviews
- Google Play reviews
- Customer support emails
- In-app feedback (if implemented)

### Performance Metrics

Track:
- App startup time
- Network request latency
- Crash-free sessions (target: >99.5%)

---

## 📋 Release Checklist Template

Use this checklist for every release:

```markdown
## Release vX.Y.Z Checklist

### Pre-Release
- [ ] All features tested on iOS
- [ ] All features tested on Android
- [ ] Automated tests passing
- [ ] No critical bugs
- [ ] Version numbers updated in app.json
- [ ] CHANGELOG.md updated
- [ ] Translations complete
- [ ] Legal documents up to date

### Build & Submit
- [ ] iOS production build created
- [ ] iOS build submitted to App Store Connect
- [ ] Android production build created
- [ ] Android build submitted to Google Play Console

### Store Listing
- [ ] iOS: Release notes written
- [ ] iOS: Screenshots updated (if needed)
- [ ] iOS: Submitted for review
- [ ] Android: Release notes written
- [ ] Android: Screenshots updated (if needed)
- [ ] Android: Rolled out to production

### Post-Release
- [ ] Sentry monitoring active
- [ ] No crash spike detected
- [ ] User reviews monitored
- [ ] Team notified of release
- [ ] Release tagged in git: `git tag v1.0.0`

### Rollback Plan
- [ ] Previous working build ID noted: _____________
- [ ] Rollback procedure reviewed
```

---

## 🔗 Useful Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

---

**Questions or issues?** Contact the development team or refer to the main [README.md](./README.md).
