# Android APK Setup for HabitQuest

## What is Capacitor?

Capacitor wraps your React web app as a native Android application. It provides:
- ✅ Native app installation (installable from Google Play or direct APK)
- ✅ Access to device features (camera, notifications, storage, etc.)
- ✅ Offline support (web assets bundled in APK)
- ✅ Push notifications capability
- ✅ Single codebase for iOS, Android, and web

---

## Quick Start (GitHub Actions - Recommended)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Add Capacitor Android setup"
git remote add origin https://github.com/YOUR_USERNAME/habit-quest.git
git branch -M main
git push -u origin main
```

### 2. Trigger Build
- Go to your GitHub repo
- Click **Actions** tab
- The "Build Android APK" workflow will run automatically
- Wait for completion (~5-10 minutes)

### 3. Download APK
- Click the completed workflow run
- Scroll to **Artifacts**
- Download `habitquest-debug.apk`

### 4. Install on Android
- Transfer APK to your Android device
- Enable "Unknown sources" in Settings → Security
- Open file manager and tap the APK to install

---

## Local Build (Advanced)

### Prerequisites
```bash
# Java 17
sudo apt-get install openjdk-17-jdk

# Android SDK (if not already installed)
sudo apt-get install android-sdk

# Set environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Build
```bash
# From project root
./build-apk.sh

# Or manually:
pnpm build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### APK Location
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## File Structure

```
habit-quest/
├── android/                          # Capacitor Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  # App permissions & config
│   │   │   ├── java/                # Native Java code
│   │   │   └── res/                 # Icons, strings, layouts
│   │   └── build.gradle             # Android build config
│   ├── build.gradle                 # Root build config
│   ├── gradle.properties            # Gradle settings
│   └── gradlew                      # Gradle wrapper
├── capacitor.config.ts              # Capacitor configuration
├── dist/public/                     # Built web assets (synced to APK)
├── .github/workflows/
│   └── build-apk.yml               # GitHub Actions workflow
├── APK_BUILD_GUIDE.md              # Detailed build instructions
├── ANDROID_SETUP.md                # This file
└── build-apk.sh                    # Local build script
```

---

## Customization

### App Icon
Replace these files in `android/app/src/main/res/`:
- `mipmap-*/ic_launcher.png` (app icon)
- `mipmap-*/ic_launcher_foreground.png` (icon foreground)
- `mipmap-*/ic_launcher_background.png` (icon background)

### App Name & Permissions
Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.habitquest.app">
    
    <application
        android:label="@string/app_name"
        ...>
    </application>
</manifest>
```

### Splash Screen
Customize in `android/app/src/main/res/drawable/splash.xml`

### App Version
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 1        // Increment for each release
    versionName "1.0"    // User-visible version
}
```

---

## Signing & Release

### Generate Keystore (One-time)
```bash
keytool -genkey -v -keystore habitquest.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias habitquest
```

### Sign Release APK
Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file("../habitquest.keystore")
            storePassword "YOUR_PASSWORD"
            keyAlias "habitquest"
            keyPassword "YOUR_PASSWORD"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

Build release:
```bash
cd android && ./gradlew assembleRelease
```

---

## Distribution

### Option 1: Direct APK Download
- Host the APK on a web server or GitHub Releases
- Users download and install manually

### Option 2: Google Play Store
1. Create a Google Play Developer account ($25 one-time)
2. Sign the APK with your keystore (see above)
3. Upload to Google Play Console
4. Configure store listing and privacy policy
5. Submit for review

### Option 3: F-Droid (Open Source)
- If your app is open source, submit to F-Droid
- Users can install from F-Droid app store

---

## Troubleshooting

### Build Fails: "Toolchain installation does not provide JAVA_COMPILER"
```bash
# Clear Gradle cache
cd android && rm -rf .gradle && ./gradlew clean
```

### Build Fails: "SDK not found"
```bash
# Install Android SDK
sudo apt-get install android-sdk

# Set environment variable
export ANDROID_HOME=$HOME/Android/Sdk
```

### APK Too Large
- Debug APK includes debugging symbols (~100-200 MB)
- Release APK is smaller (~50-100 MB)
- Build release: `./gradlew assembleRelease`

### App Crashes on Launch
- Check logcat: `adb logcat | grep habitquest`
- Ensure web assets are synced: `npx cap sync android`
- Verify `capacitor.config.ts` points to `dist/public`

---

## Testing

### On Emulator
```bash
# Start Android emulator
emulator -avd Pixel_4_API_30

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat
```

### On Physical Device
```bash
# Enable USB debugging in Settings → Developer Options
# Connect device via USB

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat | grep habitquest
```

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/docs)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Gradle Plugin Documentation](https://developer.android.com/studio/releases/gradle-plugin)

---

## Next Steps

1. ✅ Push to GitHub
2. ✅ Run GitHub Actions build
3. ✅ Download and test APK
4. ✅ Customize app icon and name
5. ✅ Generate keystore for release builds
6. ✅ Publish to Google Play Store (optional)
