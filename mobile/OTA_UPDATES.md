# Over-The-Air (OTA) Updates Guide

This guide explains how to safely publish Over-The-Air updates to the GNB Transfer mobile app using Expo's EAS Update service.

---

## 📖 What are OTA Updates?

Over-The-Air (OTA) updates allow you to push JavaScript and asset changes to your published app without going through the App Store or Play Store review process.

### Key Benefits

✅ **Fast deployment:** Updates reach users within minutes to hours  
✅ **No app store review:** Skip the 1-2 day review process  
✅ **Instant bug fixes:** Fix critical bugs immediately  
✅ **A/B testing:** Test features with a subset of users  
✅ **Content updates:** Update text, translations, and assets quickly

### Key Limitations

⛔ **No native code changes:** Can't update native modules or change permissions  
⛔ **Same runtime version:** Updates only work for compatible app versions  
⛔ **Store policy compliance:** Must not bypass review for significant changes  
⛔ **Network required:** Users must be online to receive updates

---

## 🛡️ Safety Rules: What Can vs Cannot Be Updated

Understanding these rules is **critical** to avoid breaking your app or violating store policies.

### ✅ SAFE for OTA (JavaScript-Only Changes)

Changes that **don't affect native code** and are **non-breaking**:

#### Bug Fixes
- Fix calculation errors
- Fix validation logic bugs
- Fix UI rendering issues
- Fix data parsing errors
- Fix state management bugs

#### Text & Content Updates
- Fix typos and grammar
- Update copy and messaging
- Update translations (i18n files)
- Update static content

#### UI Tweaks
- Change colors, fonts, spacing
- Adjust button sizes or positions
- Update styles (CSS/Tailwind classes)
- Show/hide UI elements
- Reorder components

#### Performance Improvements
- Optimize rendering logic
- Reduce unnecessary re-renders
- Improve data fetching efficiency
- Code splitting optimizations

#### Assets
- Update images (icons, logos)
- Update fonts (if already bundled)
- Update static JSON data

### ⛔ NOT SAFE for OTA (Requires Store Release)

Changes that **affect native code** or are **breaking changes**:

#### Native Modules
- Adding new Expo modules (expo-camera, expo-location, etc.)
- Updating Expo SDK version
- Updating React Native version
- Adding/updating native dependencies
- Changing native build configuration

#### Permissions
- Requesting new permissions (location, camera, notifications)
- Changing permission usage descriptions
- Adding background modes (iOS)

#### Navigation Changes
- Changing navigation structure significantly
- Renaming routes (if used in deep links)
- Changing authentication flow
- Removing major screens

#### API Contract Changes
- Changing data models in breaking ways
- Changing API request/response formats
- Authentication method changes
- Breaking changes to user flows

#### Significant Features
- Major new features
- New screens or sections
- Payment flow changes
- Core functionality changes

---

## 🔧 How OTA Updates Work

### Runtime Version Compatibility

The app uses the **`appVersion` policy** for runtime version matching:

```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

**What this means:**
- OTA updates are **only delivered to apps with matching `version` number**
- If a user has version `1.0.0`, they only receive updates published for `1.0.0`
- When you release version `1.1.0` to stores, create a new OTA update branch

**Example:**

| User's App Version | Published Store Version | OTA Update Branch | User Receives Update? |
|--------------------|-------------------------|-------------------|----------------------|
| 1.0.0 | 1.0.0 | `production` (v1.0.0) | ✅ Yes |
| 1.0.0 | 1.1.0 | `production` (v1.1.0) | ❌ No (different version) |
| 1.1.0 | 1.1.0 | `production` (v1.1.0) | ✅ Yes |

### Update Delivery Flow

1. **User opens app** → App checks for updates (configured as `ON_LOAD`)
2. **Update available?** → Download in background
3. **Download complete** → Next app restart applies update
4. **Fallback timeout** → If download takes >30s, use cached bundle

### Development Mode Safety

OTA updates are **automatically disabled** in development:
- `__DEV__` flag prevents OTA checks
- Development builds use Metro bundler directly
- Production builds enable OTA checking

---

## 📤 Publishing OTA Updates

### Prerequisites

Before publishing an OTA update:

- [ ] **EAS CLI installed:** `npm install -g eas-cli`
- [ ] **Logged into EAS:** `eas login`
- [ ] **Change tested locally:** Verify the fix works
- [ ] **Change is JS-only:** No native code modifications
- [ ] **No breaking changes:** Compatible with current app version

### Step 1: Make Your Changes

Edit your code to fix a bug, update text, or make UI tweaks.

**Example: Fix a typo**

```tsx
// Before
<Text>Book your tranfer now</Text>

// After
<Text>Book your transfer now</Text>
```

### Step 2: Test Your Changes

```bash
cd mobile

# Test on iOS
npm run ios

# Test on Android
npm run android

# Verify the fix works correctly
```

### Step 3: DO NOT Change Version Number

**Critical:** Do NOT increment the version number in `app.json` for OTA updates.

```json
// app.json - Keep version UNCHANGED for OTA
{
  "expo": {
    "version": "1.0.0"  // ← DO NOT CHANGE for OTA updates
  }
}
```

**Why?**
- OTA updates must match the published app version
- Changing version creates a mismatch (updates won't be delivered)
- Version increments are for new store releases only

### Step 4: Publish the Update

#### Basic Publish Command

```bash
cd mobile

# Publish to production branch
eas update --branch production --message "Fix typo in booking confirmation"
```

#### Platform-Specific Updates

If the fix is only needed on one platform:

```bash
# iOS only
eas update --branch production --platform ios --message "Fix iOS-specific date formatting"

# Android only
eas update --branch production --platform android --message "Fix Android back button behavior"
```

#### Preview/Staging Updates

For testing updates before production:

```bash
# Publish to preview branch
eas update --branch preview --message "Test booking flow improvements"
```

### Step 5: Verify Update Published

```bash
# List recent updates for production branch
eas update:list --branch production

# View details of specific update
eas update:view <update-id>
```

### Step 6: Monitor Rollout

**Watch for errors:**
1. Check Sentry for crash spikes
2. Monitor error rates
3. Check user reports/feedback

**Rollback if needed** (see Rollback section below)

---

## 📊 Update Branches

Expo updates are published to **branches**, which correspond to environments.

### Default Branch Structure

| Branch | Environment | Used For |
|--------|-------------|----------|
| `production` | Production app store builds | Live user updates |
| `preview` | TestFlight / internal testing | Testing updates before production |
| `development` | Local development builds | Local testing (not typically used) |

### Branch Configuration

Branches are tied to build profiles in `eas.json`:

```json
{
  "build": {
    "production": {
      // Production builds receive updates from "production" branch
      "channel": "production"
    },
    "preview": {
      // Preview builds receive updates from "preview" branch
      "channel": "preview"
    }
  }
}
```

### Using Multiple Branches

**Scenario:** Test an update with internal testers before releasing to all users.

```bash
# 1. Publish to preview branch first
eas update --branch preview --message "Test: Improved booking validation"

# 2. Test with TestFlight / internal APK users

# 3. If successful, publish to production
eas update --branch production --message "Improved booking validation"
```

---

## 🔄 Common OTA Update Scenarios

### Scenario 1: Fix a Critical Bug

**Problem:** Booking confirmation crashes for users with long names.

**Solution:**

```bash
# 1. Fix the bug locally
# Edit the code to handle long names

# 2. Test the fix
npm run ios
npm run android

# 3. Publish OTA update
eas update --branch production --message "Fix crash with long names in booking confirmation"

# 4. Monitor Sentry
# Watch for crash rate decrease
```

**Timeline:** Users receive fix within minutes to hours.

### Scenario 2: Update Translations

**Problem:** German translation has typos.

**Solution:**

```bash
# 1. Update translation file
# Edit: locales/de/common.json

# 2. Test
npm run ios  # Switch language to German and verify

# 3. Publish
eas update --branch production --message "Fix German translation typos"
```

### Scenario 3: Change UI Styling

**Problem:** Button color is hard to read.

**Solution:**

```tsx
// Before
<Button className="bg-blue-300 text-white" />

// After
<Button className="bg-blue-600 text-white" />
```

```bash
# Publish
eas update --branch production --message "Improve button contrast for readability"
```

### Scenario 4: Multi-Platform Update

**Problem:** Different bugs on iOS and Android.

**Solution:**

```bash
# Fix iOS bug
eas update --branch production --platform ios --message "Fix iOS date picker issue"

# Fix Android bug separately
eas update --branch production --platform android --message "Fix Android keyboard dismiss"
```

### Scenario 5: Staged Rollout (Advanced)

**Problem:** Want to test update with 10% of users first.

**Solution:**

```bash
# Option 1: Use separate branch for canary users
eas update --branch production-canary --message "Test: New booking flow"

# After validation
eas update --branch production --message "New booking flow"

# Option 2: Use EAS Update runtime filtering (advanced)
# See: https://docs.expo.dev/eas-update/runtime-versions/
```

---

## 🔙 Rolling Back Updates

If an OTA update causes issues, you can quickly roll back.

### Method 1: Republish Previous Working Update

```bash
# 1. Find the last working update
eas update:list --branch production

# 2. Note the update ID of the working version

# 3. Re-publish that update
eas update --branch production --message "Rollback to previous stable version"

# Copy the code from the working commit
git checkout <working-commit-hash> -- <changed-files>
eas update --branch production --message "Rollback: Reverted to stable version"
```

### Method 2: Publish a Fix Forward

```bash
# 1. Identify and fix the issue
# 2. Test the fix
# 3. Publish corrected update
eas update --branch production --message "Fix: Corrected booking validation logic"
```

### Emergency Rollback Procedure

**If a critical issue is discovered:**

1. **Stop the bleeding:** Immediately republish the last known good update
   ```bash
   git log --oneline  # Find last working commit
   git checkout <commit-hash> -- .
   eas update --branch production --message "EMERGENCY ROLLBACK"
   ```

2. **Notify team:** Alert team members of the issue

3. **Investigate:** Debug the issue locally

4. **Fix forward:** Once fixed, test thoroughly and republish
   ```bash
   eas update --branch production --message "Fix: Resolved critical issue"
   ```

5. **Post-mortem:** Document what went wrong and how to prevent it

---

## 📈 Monitoring OTA Updates

### Check Update Adoption

```bash
# View update statistics
eas update:list --branch production

# See which users downloaded the update
# (requires EAS Insights - paid feature)
```

### Monitor Errors with Sentry

1. **Before update:** Note baseline error rate
2. **After update:** Watch for error spikes
3. **Compare versions:** Check if new errors appear

**Sentry query example:**
- Filter by release version
- Look for errors in the last hour vs baseline

### User Feedback

Monitor for:
- App store reviews mentioning bugs
- Support emails reporting issues
- In-app feedback (if implemented)

---

## ⚠️ OTA Update Best Practices

### Do's ✅

1. **Test thoroughly locally** before publishing
2. **Publish to preview first** for staging tests
3. **Use descriptive commit messages** in `--message`
4. **Monitor error rates** after publishing
5. **Keep changes small** (single bug fix or feature)
6. **Document updates internally** (changelog or team notes)
7. **Communicate with team** before major OTA releases
8. **Have rollback plan ready** before publishing

### Don'ts ❌

1. **Don't skip testing** - always test before publishing
2. **Don't bundle multiple unrelated changes** - keep updates focused
3. **Don't change version numbers** for OTA updates
4. **Don't use OTA for native changes** - requires store release
5. **Don't bypass store review** for significant features
6. **Don't publish on Fridays** (unless absolutely necessary - harder to fix issues over weekend)
7. **Don't ignore error spikes** - roll back if needed

---

## 🔐 Store Policy Compliance

### Apple App Store Guidelines

**OTA updates must comply with App Store Review Guidelines 2.5.2:**

> Apps may use OTA update mechanisms for non-executable code provided such updates do not change the primary purpose of the app.

**What this means:**
- ✅ Bug fixes and minor improvements: **Allowed**
- ✅ Content updates (text, images): **Allowed**
- ⛔ Bypassing review for new features: **Prohibited**
- ⛔ Changing app's core purpose: **Prohibited**

**Violations can result in:**
- App removal from App Store
- Developer account suspension

### Google Play Store Policies

**OTA updates must comply with Play Store Developer Program Policies:**

> Apps must not modify, replace, or update themselves using any method other than Google Play's update mechanism.

**What this means:**
- ✅ JavaScript/content updates via Expo: **Allowed** (officially supported)
- ✅ Bug fixes and patches: **Allowed**
- ⛔ Downloading executable code from external sources: **Prohibited**

**Expo OTA is compliant** because:
- Bundled with the app's original code
- Uses Expo's trusted update mechanism
- Doesn't execute arbitrary external code

### Safe OTA Usage Summary

**To stay compliant:**
1. Use OTA only for minor updates (bug fixes, content, UI tweaks)
2. Major features should go through store review
3. Don't use OTA to bypass review policies
4. Document internal policy for what can be OTA vs store release
5. Train team on OTA vs store release decision making

---

## 📚 Additional Resources

### Expo Documentation

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [How EAS Update Works](https://docs.expo.dev/eas-update/how-it-works/)
- [Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Update Branches](https://docs.expo.dev/eas-update/how-it-works/#branches)

### Related Guides

- [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) - Full release process
- [STORE_SUBMISSION.md](./STORE_SUBMISSION.md) - Store submission guide
- [README.md](./README.md) - Main mobile app documentation

### Support

- Expo Discord: [chat.expo.dev](https://chat.expo.dev/)
- Expo Forums: [forums.expo.dev](https://forums.expo.dev/)

---

## 📋 OTA Update Checklist

Use this checklist every time you publish an OTA update:

```markdown
## OTA Update Checklist - [Date]

### Pre-Publish
- [ ] Change is JavaScript-only (no native code)
- [ ] Change tested locally on iOS
- [ ] Change tested locally on Android
- [ ] Change is non-breaking
- [ ] Version number UNCHANGED in app.json
- [ ] Descriptive commit message prepared

### Publish
- [ ] Published to preview branch first (if applicable)
- [ ] Preview tested with internal users
- [ ] Published to production branch
- [ ] Update message is clear and descriptive
- [ ] Update confirmation received from EAS CLI

### Post-Publish
- [ ] Update listed in `eas update:list`
- [ ] Sentry monitoring active
- [ ] No error spike detected (check after 1 hour)
- [ ] No user reports of issues
- [ ] Team notified of update
- [ ] Update documented in internal changelog

### Rollback Plan (If Needed)
- [ ] Last working update ID noted: __________
- [ ] Rollback command prepared
- [ ] Team aware of rollback procedure
```

---

**Questions?** Refer to [README.md](./README.md) or contact the development team.
