# GNB Transfer Mobile App

The GNB Transfer Mobile App is a React Native application built with Expo, providing customers with a seamless way to book airport transfers, view tours, and manage their bookings on the go.

[![Expo](https://img.shields.io/badge/Expo-52-000020.svg?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB.svg?logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/NativeWind-4.0-06B6D4.svg?logo=tailwindcss)](https://www.nativewind.dev/)

---

## ✨ Features

### Customer Features
- **Multi-Language Support**: 9 languages (TR, EN, AR, RU, DE, FR, ES, ZH, FA) synced with web app
- **Easy Booking**: Multi-step booking flow with passenger details and extras
- **Tour Discovery**: Browse and book tours with detailed information
- **Booking Management**: View and track your bookings in real-time
- **Profile Management**: Update personal information and preferences
- **Offline Support**: View cached data when offline with TanStack Query persistence
- **Dark Mode**: Automatic theme switching based on device settings

### Technical Features
- **Expo Router**: File-based routing with authentication guards
- **TanStack Query**: Server state management with offline persistence
- **NativeWind**: Tailwind CSS for React Native styling
- **Shared Package**: Common utilities, validators, and types with web app
- **TypeScript**: Full type safety across the codebase
- **EAS Build**: Production-ready build configuration

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | 52.0.0 | Development platform and build system |
| **React Native** | 0.76.0 | Cross-platform mobile framework |
| **Expo Router** | 4.0.0 | File-based navigation |
| **TypeScript** | 5.6 | Static type checking |
| **NativeWind** | 4.0.0 | Tailwind CSS for React Native |
| **TanStack Query** | 5.x | Server state and caching |
| **i18next** | 23.x | Internationalization |
| **Axios** | 1.7.x | HTTP client |
| **Yup** | 1.4.x | Form validation |

---

## 📱 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm**: Version 8 or higher (comes with Node.js)
- **Expo CLI**: Install globally with `npm install -g @expo/cli`
- **Expo Go App**: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Optional (for Native Builds)
- **iOS**: Xcode 15+ (macOS only)
- **Android**: Android Studio with SDK 34+
- **EAS CLI**: `npm install -g eas-cli`

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/adem1273/gnb-transfer.git
cd gnb-transfer
```

### 2. Install Root Dependencies

```bash
# From project root
npm install
```

### 3. Install Mobile Dependencies

```bash
cd mobile
npm install
```

### 4. Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit with your API URL
# For local development, use your machine's IP address
# Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

**Finding Your Local IP:**
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr IPv4
```

### 5. Start the Backend Server

In a separate terminal:
```bash
cd backend
npm run dev
```

### 6. Start the Mobile App

```bash
# In the mobile directory
npm start
# or
npx expo start
```

### 7. Run on Device/Simulator

- **Physical Device**: Scan the QR code with Expo Go app
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Web Browser**: Press `w` in the terminal

---

## 📁 Project Structure

```
mobile/
├── app/                      # Expo Router pages
│   ├── (auth)/              # Authentication screens
│   │   ├── _layout.tsx      # Auth layout
│   │   ├── login.tsx        # Login screen
│   │   └── register.tsx     # Registration screen
│   ├── (tabs)/              # Main tab screens
│   │   ├── _layout.tsx      # Tab navigation layout
│   │   ├── index.tsx        # Home screen
│   │   ├── tours.tsx        # Tours listing
│   │   ├── bookings.tsx     # User bookings
│   │   └── profile.tsx      # User profile
│   ├── booking-flow/        # Booking process screens
│   ├── tour/                # Tour detail screens
│   └── _layout.tsx          # Root layout with providers
│
├── assets/                   # Static assets
│   ├── icon.png             # App icon (1024x1024)
│   ├── splash.png           # Splash screen image
│   └── adaptive-icon.png    # Android adaptive icon
│
├── components/               # Reusable components
│   ├── common/              # Shared UI components
│   ├── skeleton/            # Loading skeleton components
│   └── index.ts             # Component exports
│
├── contexts/                 # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   ├── ErrorContext.tsx     # Global error handling
│   └── index.ts             # Context exports
│
├── scripts/                  # Utility scripts
│   └── generate-icons.sh    # Icon generation script
│
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── global.css               # Global styles
└── package.json             # Dependencies
```

---

## 💻 Development Workflow

### Available Scripts

```bash
# Start development server
npm start

# Start with specific platform
npm run ios         # iOS Simulator
npm run android     # Android Emulator
npm run web         # Web browser

# Linting
npm run lint        # Run ESLint

# Build (requires EAS CLI)
npm run prebuild    # Generate native projects
npm run build:dev   # Development build
npm run build:preview  # Preview/staging build
npm run build:prod  # Production build
```

### Development Server Commands

When the Expo development server is running:

| Key | Action |
|-----|--------|
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| `w` | Open in web browser |
| `r` | Reload the app |
| `m` | Toggle menu |
| `j` | Open debugger |
| `?` | Show all commands |

### Code Style

- **ESLint**: Enforced via `npm run lint`
- **TypeScript**: Strict mode enabled
- **Prettier**: Format code with Prettier
- **NativeWind**: Tailwind utility classes for styling

### Hot Reloading

The app supports fast refresh. Changes to your code will automatically update in the running app without losing component state.

---

## 🔨 Build Process

### Development Build (Testing on Device)

For development builds with debugging support:

```bash
# Login to EAS
eas login

# Build for iOS (internal distribution)
eas build --profile development --platform ios

# Build for Android (APK)
eas build --profile development --platform android
```

### Preview Build (Internal Testing)

For sharing with testers before app store submission:

```bash
# Build for both platforms
eas build --profile preview --platform all

# Or specific platform
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production Build

For app store submission:

```bash
# Build for App Store
eas build --profile production --platform ios

# Build for Google Play
eas build --profile production --platform android
```

### Build Profiles (eas.json)

| Profile | Use Case | Distribution |
|---------|----------|--------------|
| `development` | Debug builds | Internal (Expo Go) |
| `preview` | Testing builds | Internal (TestFlight, APK) |
| `production` | Store releases | App Store, Google Play |

### Native Build (Without EAS)

Generate native iOS/Android projects for local building:

```bash
# Generate native projects
npx expo prebuild

# iOS (requires macOS)
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

---

## 📡 OTA Update Strategy

This app uses Expo's Over-The-Air (OTA) updates for delivering safe, non-breaking JavaScript changes without requiring a new App Store or Google Play submission.

### What OTA Updates Are For

✅ **Allowed via OTA:**
- Bug fixes (logic errors, crash fixes)
- Text and copy changes (typos, translations)
- Minor UI tweaks (colors, spacing, fonts)
- Performance improvements (code optimization)

### What OTA Updates Must NEVER Be Used For

⛔ **Requires Full Store Release:**
- Navigation structure changes
- Authentication flow modifications
- Data model or API contract changes
- Native module additions or updates
- New permissions requirements
- Significant feature additions

### How runtimeVersion Prevents Incompatible Updates

The app uses the `appVersion` policy for `runtimeVersion`:

```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

This ensures that OTA updates are only delivered to app versions with matching native code. When you:
- Update native modules → Increment app version → New store release required
- Make JS-only changes → Same runtimeVersion → OTA update delivered

### Development Environment Safety

OTA updates are **automatically disabled** in development:
- Development builds use the local Metro bundler
- `__DEV__` flag ensures OTA checks never interfere with local development
- Production builds (via EAS) enable OTA checking on app load

### App Store / Play Store Compliance

⚠️ **Important Policy Reminder:**
- Apple App Store and Google Play Store policies prohibit using OTA updates to bypass app review
- OTA updates must only deliver minor bug fixes and improvements
- Any significant functionality changes must go through the standard review process
- Violating these policies can result in app removal from stores

### Configuration Reference

```json
{
  "updates": {
    "enabled": true,
    "checkAutomatically": "ON_LOAD",
    "fallbackToCacheTimeout": 30000
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `enabled` | `true` | Enable OTA updates in production |
| `checkAutomatically` | `ON_LOAD` | Check for updates when app starts |
| `fallbackToCacheTimeout` | `30000` | 30-second timeout before using cached bundle |
| `runtimeVersion.policy` | `appVersion` | Match updates to app version |

---

## 🌐 API Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://192.168.1.100:5000/api` |

### API URL Configuration by Environment

**Development (eas.json):**
```json
{
  "development": {
    "env": {
      "EXPO_PUBLIC_API_URL": "http://localhost:5000/api"
    }
  }
}
```

**Preview/Staging:**
```json
{
  "preview": {
    "env": {
      "EXPO_PUBLIC_API_URL": "https://staging-api.gnbtransfer.com/api"
    }
  }
}
```

**Production:**
```json
{
  "production": {
    "env": {
      "EXPO_PUBLIC_API_URL": "https://api.gnbtransfer.com/api"
    }
  }
}
```

### Network Access (Development)

When running on a physical device, ensure:

1. Device and computer are on the same WiFi network
2. Use your computer's local IP address (not `localhost`)
3. Backend is running and accessible

---

## 🔒 Authentication Flow

The app uses JWT-based authentication with the same backend as the web app:

1. **Login**: User enters credentials → receives access + refresh tokens
2. **Token Storage**: Tokens stored securely in AsyncStorage
3. **Auto Refresh**: Access token refreshed automatically before expiry
4. **Logout**: Tokens cleared from storage

### Protected Routes

The app uses Expo Router's layout system for authentication guards:

- `(auth)/*` - Public routes (login, register)
- `(tabs)/*` - Protected routes (requires authentication)
- `tour/*` - Public routes (tour details)

---

## 🔌 Offline Support

The app includes comprehensive offline support:

### Features
- **Query Caching**: TanStack Query persists data to AsyncStorage
- **Network Detection**: Automatic online/offline status detection
- **Offline First**: Cached data displayed while offline
- **Background Sync**: Automatic refetch when connection restored

### Configuration
- Cache duration: 24 hours
- Stale time: 5 minutes
- Network mode: `offlineFirst`

---

## 🛡️ Sentry Crash Reporting

The app uses Sentry for crash and error visibility in production builds.

### Purpose

Sentry provides visibility into unexpected runtime crashes and errors that occur in production. This helps identify and fix bugs that users encounter.

> **⚠️ FREE TIER ONLY**: This integration uses only Sentry's free tier features. No paid features are enabled.

### Disabled Features (Cost/Privacy Safety)

The following features are explicitly **DISABLED** to stay within free tier limits and protect user privacy:

| Feature | Status | Reason |
|---------|--------|--------|
| Performance Tracing | ❌ Disabled | Paid feature / quota impact |
| Session Replay | ❌ Disabled | Paid feature |
| Profiling | ❌ Disabled | Paid feature |
| Auto Session Tracking | ❌ Disabled | Reduces event volume |
| HTTP Breadcrumbs | ❌ Filtered | May contain tokens/auth headers |
| Console Breadcrumbs | ❌ Filtered | May contain sensitive data |

### Free Tier Limits

⚠️ **Sentry free tier includes limited events per month.** Monitor your usage at [sentry.io](https://sentry.io/) to avoid unexpected charges.

The configuration is optimized to minimize event volume:
- Only captures unexpected runtime errors
- Filters out validation errors (expected behavior)
- Filters out handled network errors
- No performance monitoring events

### Configuration

1. Create a free Sentry account at [sentry.io](https://sentry.io/signup/)
2. Create a new React Native project
3. Copy your DSN to the environment:

```bash
# In mobile/.env (production)
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Development vs Production

| Environment | Sentry Status | Reason |
|-------------|---------------|--------|
| Development (`__DEV__` = true) | ❌ Disabled | Errors logged to console only |
| Production (EAS builds) | ✅ Enabled | Errors sent to Sentry |

### Security & Privacy

The integration follows strict privacy rules:
- ✅ Never sends tokens or auth headers
- ✅ Never sends personal user data
- ✅ Never logs API request/response bodies
- ✅ Navigation breadcrumbs have query params stripped
- ✅ Error reports are minimal and anonymized

### Manual Error Capture

For unexpected runtime errors not caught by the Error Boundary:

```typescript
import { captureException } from '../sentry';

try {
  await riskyOperation();
} catch (error) {
  // Only capture unexpected errors, not validation/network errors
  captureException(error, { operation: 'riskyOperation' });
}
```

---

## 📱 App Store & Play Store Readiness

This section outlines the technical requirements and checklist for submitting the app to the Apple App Store and Google Play Store.

### Store Submission Checklist

#### ✅ Completed (Technical Configuration)

| Item | Status | Notes |
|------|--------|-------|
| App name & slug | ✅ Done | `GNB Transfer` / `gnb-transfer` |
| Bundle identifiers | ✅ Done | `com.gnbtransfer.app` (iOS & Android) |
| Version (semver) | ✅ Done | `1.0.0` |
| iOS buildNumber | ✅ Done | `1` (increment for each TestFlight/App Store upload) |
| Android versionCode | ✅ Done | `1` (increment for each Play Store upload) |
| Orientation | ✅ Done | Portrait only |
| Splash screen config | ✅ Done | Brand color `#1D4ED8` |
| URL scheme | ✅ Done | `gnb-transfer://` for deep linking |
| OTA updates config | ✅ Done | Safe `appVersion` policy |
| EAS build profiles | ✅ Done | development, preview, production |
| Sentry (free tier) | ✅ Done | Production-only, no paid features |
| Permissions audit | ✅ Done | No special permissions required |

#### 📋 TODO: Manual Work Required

The following items **cannot be completed by automation** and require manual work:

**Assets (Design Work):**
- [ ] **App Icon** - `assets/icon.png` (1024×1024px, PNG, no alpha for iOS)
- [ ] **Splash Screen** - `assets/splash-icon.png` (centered logo, transparent background)
- [ ] **Adaptive Icon (Android)** - `assets/adaptive-icon.png` (foreground layer, 1024×1024px)
- [ ] **Favicon (Web)** - `assets/favicon.png` (48×48px minimum)

**App Store Screenshots:**
| Device | Resolution | Quantity |
|--------|------------|----------|
| iPhone 6.7" | 1290×2796 | 3-10 |
| iPhone 6.5" | 1242×2688 | 3-10 |
| iPhone 5.5" | 1242×2208 | 3-10 |
| iPad Pro 12.9" | 2048×2732 | 3-10 (if supporting iPad) |

**Play Store Screenshots:**
| Type | Resolution | Quantity |
|------|------------|----------|
| Phone | 1080×1920 (min) | 2-8 |
| 7" Tablet | 1200×1920 | 2-8 (if supporting) |
| 10" Tablet | 1800×2560 | 2-8 (if supporting) |

**Legal Pages (Required for Store Approval):**
- [ ] **Privacy Policy** - Host at `https://gnbtransfer.com/privacy-policy`
- [ ] **Terms of Service** - Host at `https://gnbtransfer.com/terms-of-service`

**Store Listings (Per Store):**
- [ ] App description (short & full)
- [ ] Keywords / tags
- [ ] Category selection
- [ ] Contact email
- [ ] Marketing URL

**Accounts & Credentials:**
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Developer account ($25 one-time)
- [ ] App Store Connect API key (for EAS Submit)
- [ ] Google Play service account JSON key (for EAS Submit)

---

## 🔄 Versioning Strategy

Understanding when and how to update version numbers is critical for safe releases.

### Version Number Reference

| Field | Location | Format | Increment When |
|-------|----------|--------|----------------|
| `version` | app.json | Semver (1.0.0) | User-visible changes, new features |
| `buildNumber` (iOS) | app.json | Integer string | **Every** App Store / TestFlight upload |
| `versionCode` (Android) | app.json | Integer | **Every** Play Store upload |
| `runtimeVersion` | Automatic | Based on `version` | Native code changes (via policy) |

### When to Bump Version Numbers

#### Version (semver: `version`)
- **MAJOR (2.0.0)**: Breaking changes, major redesigns, incompatible API changes
- **MINOR (1.1.0)**: New features, non-breaking enhancements
- **PATCH (1.0.1)**: Bug fixes, minor improvements (can often be OTA)

#### Build Numbers (`buildNumber` / `versionCode`)
- **Always increment** before uploading to stores
- Can have multiple builds per version (e.g., version `1.0.0` with builds `1`, `2`, `3`)
- Never reuse a build number for the same version

### OTA vs Store Release Decision Tree

```
┌─────────────────────────────────────┐
│ What type of change is this?        │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┴─────────────┐
    ▼                           ▼
┌───────────┐           ┌───────────────┐
│ JS-only   │           │ Native code   │
│ change?   │           │ change?       │
└─────┬─────┘           └───────┬───────┘
      │                         │
      ▼                         ▼
┌─────────────────┐     ┌─────────────────────┐
│ Safe for OTA:   │     │ REQUIRES STORE      │
│ • Bug fixes     │     │ RELEASE:            │
│ • Text changes  │     │ • New permissions   │
│ • Minor UI      │     │ • Native modules    │
│ • Performance   │     │ • SDK updates       │
└─────────────────┘     │ • Navigation major  │
                        │ • Auth flow major   │
                        └─────────────────────┘
```

### Safe OTA Update Examples

✅ **Allowed via OTA:**
- Fixing a typo in a label
- Changing button colors
- Fixing a calculation bug
- Adding/updating translations
- Performance optimizations (JS-only)

### Requires Store Release Examples

⛔ **NOT allowed via OTA:**
- Adding `expo-camera` or `expo-location`
- Updating Expo SDK version
- Changing navigation structure significantly
- Modifying authentication flows
- Adding new native modules
- Requesting new permissions

---

## 🔐 Privacy & Legal Requirements

### GDPR & Privacy Compliance

> ⚠️ **Legal Disclaimer**: This section provides technical guidance only. Consult a legal professional for compliance requirements specific to your jurisdiction.

#### Data Collection Summary

| Data Type | Collected | Purpose | Storage |
|-----------|-----------|---------|---------|
| Email | Yes | Account, bookings | Backend DB |
| Phone | Yes | Booking contact | Backend DB |
| Name | Yes | Booking contact | Backend DB |
| Location (GPS) | **No** | Not used | N/A |
| Photos/Camera | **No** | Not used | N/A |
| Device ID | Minimal | Crash reports (Sentry) | Sentry (anonymized) |

#### Required Legal Documents

**Privacy Policy** must cover:
- What data is collected
- How data is used
- Third-party services (Sentry, Stripe/PayTR)
- User rights (access, deletion, correction)
- Data retention periods
- Contact information

**Terms of Service** should cover:
- Service description
- User responsibilities
- Payment terms
- Cancellation/refund policy
- Liability limitations
- Dispute resolution

#### Hosting Legal Pages

Host your legal pages at a publicly accessible URL:
- **Privacy Policy**: `https://gnbtransfer.com/privacy-policy`
- **Terms of Service**: `https://gnbtransfer.com/terms-of-service`

These URLs are referenced in `app.json` under `expo.extra` and should be linked in your app's settings/profile screen.

#### App Store Requirements

**Apple App Store:**
- Privacy Policy URL required for all apps
- App Privacy "nutrition labels" in App Store Connect
- Data deletion mechanism required (if account creation exists)

**Google Play Store:**
- Privacy Policy URL required
- Data Safety section in Play Console
- Must disclose third-party data sharing

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Expo Go Can't Connect to Development Server

```
Error: Could not connect to development server
```

**Solutions:**
1. Ensure device and computer are on same WiFi network
2. Check if backend is running on correct port
3. Try using tunnel mode: `npx expo start --tunnel`
4. Verify firewall isn't blocking port 8081

#### 2. Metro Bundler Issues

```
Error: Unable to resolve module
```

**Solutions:**
```bash
# Clear Metro cache
npx expo start --clear

# Or manually clear
rm -rf node_modules/.cache
rm -rf .expo
npm install
```

#### 3. iOS Simulator Not Found

```
Error: No simulator found
```

**Solutions:**
```bash
# macOS only - Open Xcode and install a simulator
xcode-select --install
# Then open Xcode > Settings > Platforms > Download iOS Simulator
```

#### 4. Android Emulator Issues

```
Error: No Android device found
```

**Solutions:**
1. Ensure Android Studio is installed with SDK
2. Create an AVD (Android Virtual Device) in Android Studio
3. Start the emulator before running `npm run android`
4. Check if `adb` is in PATH: `adb devices`

#### 5. Build Failures

```
Error: Build failed
```

**Solutions:**
```bash
# Clean and rebuild
npm run prebuild -- --clean
rm -rf node_modules
npm install
```

#### 6. NativeWind Styles Not Applying

**Solutions:**
1. Ensure `global.css` is imported in `_layout.tsx`
2. Restart Metro bundler: `npx expo start --clear`
3. Check `tailwind.config.js` content paths

#### 7. API Requests Failing

**Solutions:**
1. Check API URL in environment variables
2. Ensure backend is running
3. Check network connectivity
4. Verify CORS settings on backend include mobile origin

### Debug Tools

```bash
# Open React Native debugger
npx expo start --go

# Then press 'j' to open JavaScript debugger
```

### Useful Commands

```bash
# Check Expo environment
npx expo doctor

# Clear all caches
npx expo start --clear

# View build logs
eas build:list

# View device logs
npx react-native log-ios
npx react-native log-android
```

---

## 📱 Screenshots

*Screenshots will be added here showcasing the main app screens:*

| Home | Tours | Bookings | Profile |
|------|-------|----------|---------|
| 📱 Home screen with featured destinations | 🗺️ Browse available tours | ✈️ View and manage bookings | 👤 User profile settings |

> **Note**: Add actual screenshots to the `screenshots/` directory and update the table above with image references like `![Home](./screenshots/home.png)`.

---

## 🔗 Related Documentation

### Mobile App Guides

- **[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)** - Complete release process (versioning, builds, TestFlight, store submission)
- **[STORE_SUBMISSION.md](./STORE_SUBMISSION.md)** - App Store & Play Store submission checklists
- **[OTA_UPDATES.md](./OTA_UPDATES.md)** - Over-The-Air update procedures and safety rules
- **[PRIVACY_LEGAL.md](./PRIVACY_LEGAL.md)** - Privacy policy, legal requirements, GDPR/CCPA compliance
- **[ASSETS_CHECKLIST.md](./ASSETS_CHECKLIST.md)** - Complete asset requirements (icons, screenshots, graphics)

### Project Documentation

- [Main Project README](../README.md) - Full project overview
- [Backend Documentation](../backend/README.md) - API documentation
- [Shared Package](../packages/shared/README.md) - Shared utilities and types

### External Resources

- [Expo Documentation](https://docs.expo.dev/) - Official Expo docs
- [Expo Router](https://expo.github.io/router/docs) - Navigation documentation
- [NativeWind](https://www.nativewind.dev/) - Tailwind for React Native

---

## 📄 License

This project is licensed under the ISC License. See the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ by the GNB Transfer Team**
