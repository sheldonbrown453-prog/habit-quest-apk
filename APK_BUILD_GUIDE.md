# HabitQuest Android APK Build Guide

## Overview
HabitQuest is wrapped as a native Android app using **Capacitor**, which packages the React web app into a native Android shell. You have several options to build the APK.

---

## Option 1: GitHub Actions (Recommended - Fully Automated)

### Setup
1. Push this repository to GitHub
2. Go to your GitHub repo → **Settings** → **Actions** → **General**
3. Ensure "Actions permissions" is set to "Allow all actions and reusable workflows"
4. Create a git tag to trigger a release build:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### Build
- The workflow will automatically trigger on push or when you create a release tag
- Go to **Actions** tab → **Build Android APK** → view the latest run
- Once complete, the APK will be available as an artifact download

### Download APK
- Click the workflow run → scroll to **Artifacts** → download `habitquest-debug.apk`
- Or create a GitHub Release (tag) and the APK will be attached automatically

---

## Option 2: Local Build (Requires Android SDK)

### Prerequisites
```bash
# Install Java 17
sudo apt-get install openjdk-17-jdk

# Install Android SDK (via Android Studio or sdkmanager)
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Build Steps
```bash
# Install dependencies
pnpm install

# Build web assets
pnpm build

# Sync to Android project
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# APK location
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Option 3: Capacitor Cloud Build

1. Create a free account at https://capacitor.ionicframework.com/
2. Connect your GitHub repository
3. Trigger a build from the Capacitor Cloud dashboard
4. Download the built APK directly

---

## Installation on Android Device

### From APK File
1. Transfer `app-debug.apk` to your Android device
2. Enable "Unknown sources" in Settings → Security
3. Open file manager, tap the APK, and install

### From Google Play Store (Future)
Once you're ready for production:
1. Generate a release keystore:
   ```bash
   keytool -genkey -v -keystore habitquest.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias habitquest
   ```
2. Update `android/app/build.gradle` with signing config
3. Build release APK: `./gradlew assembleRelease`
4. Upload to Google Play Console

---

## Troubleshooting

### "Toolchain installation does not provide JAVA_COMPILER"
- Ensure Java 17+ is installed and set as default
- Clear Gradle cache: `cd android && rm -rf .gradle && ./gradlew clean`

### "SDK not found"
- Install Android SDK: `sudo apt-get install android-sdk`
- Set `ANDROID_HOME` environment variable

### APK is too large
- The debug APK includes symbols for debugging. Release builds are smaller.
- Build release: `./gradlew assembleRelease`

---

## Project Structure

```
habit-quest/
├── android/                    # Capacitor Android project
│   ├── app/build.gradle       # Android build config
│   └── gradlew                # Gradle wrapper
├── capacitor.config.ts        # Capacitor configuration
├── dist/public/               # Built web assets
└── .github/workflows/         # GitHub Actions
    └── build-apk.yml         # APK build workflow
```

---

## Next Steps

1. **Push to GitHub** and trigger the GitHub Actions workflow
2. **Download the APK** from the Actions artifacts
3. **Test on Android device** or emulator
4. **Customize** the app icon and splash screen in `android/app/src/main/res/`
5. **Prepare for Play Store** by generating a release keystore and signing the APK

---

## Support

For issues with Capacitor:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Forum](https://forum.ionicframework.com/)

For Android build issues:
- [Android Gradle Plugin Docs](https://developer.android.com/studio/releases/gradle-plugin)
