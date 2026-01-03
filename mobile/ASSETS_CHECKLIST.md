# Mobile App Assets Checklist

This document provides a complete checklist of all visual assets required for the GNB Transfer mobile app store submissions.

---

## 📋 Overview

Before submitting to App Store or Play Store, you need:
- ✅ App icons (multiple sizes)
- ✅ Splash screens
- ✅ Screenshots (multiple device sizes)
- ✅ Feature graphics (Google Play)
- ✅ Promotional materials (optional but recommended)

---

## 🎨 Required Assets Summary

| Asset Type | iOS | Android | Status |
|------------|-----|---------|--------|
| **App Icon** | Required | Required | ⚠️ Placeholder |
| **Splash Screen** | Required | Required | ⚠️ Placeholder |
| **Adaptive Icon** | N/A | Required | ⚠️ Placeholder |
| **Screenshots** | Required (3-10 per size) | Required (2-8) | ❌ Not created |
| **Feature Graphic** | N/A | Required | ❌ Not created |
| **Promotional Graphic** | N/A | Optional | ❌ Not created |

---

## 📱 App Icon

The app icon is the first thing users see. Make it memorable, simple, and recognizable.

### iOS Requirements

| Requirement | Specification |
|-------------|--------------|
| **Size** | 1024 × 1024 pixels |
| **Format** | PNG |
| **Color Space** | RGB |
| **Transparency** | ❌ No alpha channel |
| **Rounded Corners** | ❌ Don't add (iOS applies automatically) |
| **Content** | No text smaller than 44pt |
| **File Location** | `mobile/assets/icon.png` |

**iOS Auto-Generated Sizes:**
- App Store: 1024 × 1024
- iPhone: 180 × 180, 120 × 120, 87 × 87, 80 × 80, 60 × 60, 58 × 58, 40 × 40
- iPad: 167 × 167, 152 × 152, 76 × 76
- Notifications: 40 × 40, 20 × 20

### Android Requirements

| Requirement | Specification |
|-------------|--------------|
| **Size** | 1024 × 1024 pixels |
| **Format** | PNG 32-bit |
| **Color Space** | RGB |
| **Transparency** | ✅ Optional |
| **Rounded Corners** | ❌ Don't add (Android applies) |
| **File Location** | `mobile/assets/icon.png` |

**Android Auto-Generated Sizes:**
- xxxhdpi: 192 × 192
- xxhdpi: 144 × 144
- xhdpi: 96 × 96
- hdpi: 72 × 72
- mdpi: 48 × 48

### Design Guidelines

**Best Practices:**
- ✅ Simple and recognizable at small sizes
- ✅ Unique and memorable
- ✅ Consistent with brand identity
- ✅ Works well on both light and dark backgrounds
- ✅ Avoid fine details (they get lost at small sizes)
- ✅ Use bold, clear shapes
- ✅ Consider accessibility (color contrast)

**Common Mistakes:**
- ❌ Too much detail (icon is 60px on device)
- ❌ Text that's unreadable at small sizes
- ❌ Photos or complex images
- ❌ Too many colors
- ❌ Adding device frames or borders
- ❌ Copying competitor icons

### Icon Checklist

- [ ] 1024 × 1024 PNG created
- [ ] No transparency (iOS requirement)
- [ ] No rounded corners (system applies)
- [ ] Tested at small sizes (60px)
- [ ] Works on light backgrounds
- [ ] Works on dark backgrounds
- [ ] Matches brand colors
- [ ] File saved to `mobile/assets/icon.png`
- [ ] File size < 1MB

### Tools for Icon Design

- **Design Tools:**
  - Figma (free, web-based)
  - Sketch (macOS)
  - Adobe Illustrator
  - Affinity Designer

- **Icon Generators:**
  - [MakeAppIcon](https://makeappicon.com/)
  - [AppIconBuilder](https://appiconbuilder.com/)
  - [Icon Kitchen](https://icon.kitchen/)

---

## 🌅 Splash Screen

The splash screen appears while the app loads. Keep it simple and brand-focused.

### Requirements

| Requirement | Specification |
|-------------|--------------|
| **Size** | 1242 × 2436 pixels minimum |
| **Format** | PNG with transparency |
| **Content** | Logo/icon centered on transparent background |
| **Background Color** | Set in app.json (`#1D4ED8` currently) |
| **File Location** | `mobile/assets/splash-icon.png` |

**Current Configuration (app.json):**
```json
{
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#1D4ED8"
  }
}
```

### Design Guidelines

**Best Practices:**
- ✅ Center logo/icon on transparent background
- ✅ Keep simple (just logo, no text typically)
- ✅ Use brand colors for background
- ✅ Ensure logo is visible on background color
- ✅ Test on both iOS and Android

**Dimensions:**
- Logo should fit within central 50% of screen
- Leave ample padding (20% on all sides)

### Splash Screen Checklist

- [ ] Logo/icon created at high resolution
- [ ] Saved as PNG with transparent background
- [ ] Centered composition
- [ ] Works on `#1D4ED8` blue background
- [ ] File saved to `mobile/assets/splash-icon.png`
- [ ] File size < 500KB
- [ ] Tested on both iOS and Android simulators

### Alternative: Image-Based Splash (Not Recommended)

If you prefer a full-screen splash image:

```json
{
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "cover",
    "backgroundColor": "#FFFFFF"
  }
}
```

Size: 1242 × 2436 (iPhone 11 Pro Max portrait)

---

## 🔄 Adaptive Icon (Android Only)

Android uses an "adaptive icon" system where your icon can be masked into different shapes (circle, square, rounded square) depending on device manufacturer.

### Requirements

| Requirement | Specification |
|-------------|--------------|
| **Foreground Size** | 1024 × 1024 pixels |
| **Format** | PNG with transparency |
| **Safe Zone** | Center 66% circle contains key elements |
| **Background Color** | Set in app.json (`#1D4ED8`) |
| **File Location** | `mobile/assets/adaptive-icon.png` |

**Current Configuration (app.json):**
```json
{
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#1D4ED8"
    }
  }
}
```

### Design Guidelines

**Safe Zone:**
- Center 66% (diameter ~696px) must contain all key elements
- Outer 33% may be cropped on some devices

**Best Practices:**
- ✅ Icon fits entirely within center circle
- ✅ Test with different mask shapes (circle, rounded square, squircle)
- ✅ Consider how icon looks with background color

### Adaptive Icon Checklist

- [ ] Foreground image created (1024 × 1024)
- [ ] Key elements within center 66% safe zone
- [ ] Saved as PNG with transparency
- [ ] Tested with different mask shapes
- [ ] Works with `#1D4ED8` background color
- [ ] File saved to `mobile/assets/adaptive-icon.png`
- [ ] File size < 500KB

### Testing Adaptive Icons

**Online Tool:**
- [Adaptive Icon Preview](https://adapticon.tooo.io/)

Upload your foreground image and test different shapes.

---

## 📸 App Store Screenshots

Screenshots showcase your app's features to potential users. High-quality screenshots can significantly improve conversion rates.

### iOS Screenshot Requirements

Apple requires screenshots for **at least** these sizes:

| Device | Resolution | Required? |
|--------|------------|-----------|
| **iPhone 6.7"** (Pro Max) | 1290 × 2796 | ✅ Yes |
| **iPhone 6.5"** (11/12/13 Pro Max) | 1242 × 2688 | ✅ Yes |
| **iPhone 5.5"** (8 Plus) | 1242 × 2208 | ✅ Yes |
| iPad Pro 12.9" | 2048 × 2732 | ⚠️ If supporting iPad |

**Quantity:** 3-10 screenshots per size

**Format:** PNG or JPG (PNG recommended)

**File Size:** Max 500MB per screenshot (realistically < 1MB each)

### Android Screenshot Requirements

Google Play accepts various sizes but recommends:

| Type | Resolution | Quantity |
|------|------------|----------|
| **Phone** | 1080 × 1920 or higher | 2-8 |
| 7" Tablet | 1200 × 1920 | 2-8 (optional) |
| 10" Tablet | 1800 × 2560 | 2-8 (optional) |

**Format:** PNG or JPG (no alpha channel)

**Orientation:** Portrait or landscape (be consistent)

### Screenshot Content Ideas

Create 3-10 screenshots showing:

1. **Home Screen**
   - Featured destinations
   - Tour highlights
   - Search/booking entry point

2. **Tour Listing**
   - Browse available tours
   - Filter/search options
   - Tour cards with images

3. **Booking Flow**
   - Easy step-by-step process
   - Passenger details form
   - Date/time selection

4. **Booking Confirmation**
   - Confirmation screen
   - Booking details
   - QR code / booking reference

5. **My Bookings**
   - List of user's bookings
   - Status indicators
   - Quick actions

6. **User Profile**
   - Profile management
   - Settings
   - Language selection

### Screenshot Design Best Practices

**Content:**
- ✅ Show actual app UI (no mockups)
- ✅ Use real, appealing content (not Lorem Ipsum)
- ✅ Highlight key features
- ✅ Show value proposition clearly

**Design:**
- ✅ Add text overlays explaining features
- ✅ Use brand colors for text backgrounds
- ✅ Ensure text is readable (high contrast)
- ✅ Consider localized screenshots for different languages
- ✅ Use device frames (optional, but looks polished)

**Avoid:**
- ❌ Blurry or pixelated images
- ❌ Too much text (keep it concise)
- ❌ Showing bugs or errors
- ❌ Displaying fake data or placeholders

### Screenshot Checklist

**For Each Screenshot:**
- [ ] High resolution (meets size requirements)
- [ ] Real app content (not placeholder)
- [ ] Text is readable
- [ ] Shows a clear feature or benefit
- [ ] Follows brand guidelines
- [ ] File size < 1MB
- [ ] Saved to `mobile/screenshots/` directory

**Overall:**
- [ ] 3-10 screenshots created for iOS 6.7"
- [ ] 3-10 screenshots created for iOS 6.5"
- [ ] 3-10 screenshots created for iOS 5.5"
- [ ] 2-8 screenshots created for Android (1080×1920)
- [ ] Screenshots numbered in order (01, 02, 03...)
- [ ] Consistent style across all screenshots

### Tools for Creating Screenshots

**Capture Screenshots:**
- iOS Simulator (Cmd+S to save)
- Android Emulator (Screenshot button)
- Physical devices (screenshot + AirDrop/transfer)

**Add Device Frames & Text:**
- [Figma](https://www.figma.com/) - Free, web-based
- [Sketch](https://www.sketch.com/) - macOS, paid
- [Previewed](https://previewed.app/) - Screenshot mockups
- [AppLaunchpad](https://theapplaunchpad.com/) - Screenshot builder
- [App Store Screenshot Generator](https://www.appstorescreenshot.com/)

**Device Frame Resources:**
- [Facebook Design Devices](https://design.facebook.com/toolsandresources/devices/)
- [Mockuper.net](https://mockuper.net/)

---

## 🎨 Feature Graphic (Google Play Only)

The feature graphic is a banner image displayed at the top of your Google Play listing.

### Requirements

| Requirement | Specification |
|-------------|--------------|
| **Size** | 1024 × 500 pixels |
| **Format** | JPG or PNG (no alpha channel) |
| **File Size** | Max 1MB |
| **Content** | App name, key benefit, brand imagery |

### Design Guidelines

**Content:**
- App name or logo
- Key value proposition (e.g., "Easy Airport Transfers")
- Brand colors and imagery
- Call-to-action (optional, e.g., "Book Now")

**Best Practices:**
- ✅ High contrast (readable at small sizes)
- ✅ Avoid text smaller than 20pt
- ✅ Use brand colors
- ✅ Keep it simple and bold
- ✅ Test on both light and dark backgrounds

**Common Mistakes:**
- ❌ Too much text
- ❌ Low contrast
- ❌ Cluttered design
- ❌ Unprofessional or generic stock photos

### Feature Graphic Checklist

- [ ] 1024 × 500 PNG or JPG created
- [ ] App name or logo included
- [ ] Key benefit/value proposition shown
- [ ] Uses brand colors
- [ ] Text is readable
- [ ] No alpha channel (if PNG)
- [ ] File size < 1MB
- [ ] Saved to `mobile/screenshots/feature-graphic.png`

### Examples

**Good Feature Graphics Include:**
- App icon + "GNB Transfer - Easy Airport Bookings"
- Hero image of a tour destination + "Discover Turkey with GNB Transfer"
- App screenshot montage + "Book. Track. Travel."

---

## 🎥 Promotional Materials (Optional)

While not required, these can boost your app's visibility.

### App Preview Video (iOS)

**Specs:**
- Length: 15-30 seconds
- Resolution: Same as screenshot sizes
- Format: .mov, .mp4, .m4v
- Max file size: 500MB

**Content Ideas:**
- Quick app tour
- Booking flow demonstration
- Key features highlight

### Promotional Video (Google Play)

**Specs:**
- YouTube video link
- Length: 30 seconds - 2 minutes

### Promo Graphic (Google Play)

**Specs:**
- Size: 180 × 120 pixels
- Format: PNG or JPG
- Used in Play Store search results (if video exists)

---

## 📂 File Organization

Organize your assets in the mobile directory:

```
mobile/
├── assets/
│   ├── icon.png                  (1024×1024 app icon)
│   ├── splash-icon.png            (logo for splash, transparent)
│   ├── splash.png                 (full splash image, optional)
│   ├── adaptive-icon.png          (1024×1024 Android adaptive)
│   └── favicon.png                (48×48 web favicon)
│
└── screenshots/
    ├── ios/
    │   ├── 6.7-inch/
    │   │   ├── 01-home.png        (1290×2796)
    │   │   ├── 02-tours.png
    │   │   ├── 03-booking.png
    │   │   └── ...
    │   ├── 6.5-inch/
    │   │   └── ...                (1242×2688)
    │   └── 5.5-inch/
    │       └── ...                (1242×2208)
    │
    ├── android/
    │   ├── 01-home.png            (1080×1920)
    │   ├── 02-tours.png
    │   ├── 03-booking.png
    │   └── ...
    │
    └── feature-graphic.png        (1024×500, Google Play)
```

---

## ✅ Final Checklist

### Before Submission

**App Icons:**
- [ ] iOS icon (1024×1024, no alpha) created and placed
- [ ] Android icon (1024×1024, 32-bit) created and placed
- [ ] Adaptive icon (1024×1024, transparent) created and placed
- [ ] Icons tested on both light and dark backgrounds

**Splash Screens:**
- [ ] Splash icon (transparent PNG) created and placed
- [ ] Background color configured in app.json
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator

**Screenshots:**
- [ ] iOS 6.7" screenshots (3-10) created
- [ ] iOS 6.5" screenshots (3-10) created
- [ ] iOS 5.5" screenshots (3-10) created
- [ ] Android screenshots (2-8) created
- [ ] Screenshots show real app content
- [ ] Screenshots are high quality
- [ ] Screenshots saved to `mobile/screenshots/`

**Android Specific:**
- [ ] Feature graphic (1024×500) created
- [ ] Feature graphic saved to `mobile/screenshots/`

**Optional but Recommended:**
- [ ] App preview video created (iOS)
- [ ] Promotional video uploaded (Google Play)
- [ ] Promo graphic created (Google Play)

### Quality Check

- [ ] All assets are high resolution
- [ ] No blurry or pixelated images
- [ ] Brand colors consistent across assets
- [ ] Text is readable on all assets
- [ ] File sizes are optimized (< 1MB each)
- [ ] File names are descriptive
- [ ] Assets organized in correct directories

---

## 🎨 Design Resources

### Stock Photos & Icons
- [Unsplash](https://unsplash.com/) - Free high-quality photos
- [Pexels](https://www.pexels.com/) - Free stock photos
- [Flaticon](https://www.flaticon.com/) - Icons (check license)

### Design Inspiration
- [Mobbin](https://mobbin.com/) - Mobile app design patterns
- [App Store Screenshots Gallery](https://www.appstorescreenshots.com/)
- [Mobile Patterns](https://www.mobile-patterns.com/)

### Color Tools
- [Coolors](https://coolors.co/) - Color palette generator
- [Adobe Color](https://color.adobe.com/) - Color wheel

### Device Mockups
- [Facebook Design Devices](https://design.facebook.com/toolsandresources/devices/)
- [Mockuuups](https://mockuuups.studio/)
- [Smartmockups](https://smartmockups.com/)

---

## 📞 Need Help?

**Designer Not Available?**
- Consider hiring on Fiverr, Upwork, or 99designs
- Use online tools like Canva for simple designs
- Check competitor apps for inspiration (don't copy!)

**Questions about specs?**
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android App Icon Design](https://developer.android.com/google-play/resources/icon-design-specifications)
- [Google Play Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)

---

**Ready to create your assets?** Follow this checklist and you'll have everything needed for store submission! 🎨
