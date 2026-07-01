#!/bin/bash

# HabitQuest APK Build Script
# This script builds the Android APK locally

set -e

echo "🚀 HabitQuest APK Builder"
echo "=========================="

# Check prerequisites
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Install Java 17:"
    echo "   sudo apt-get install openjdk-17-jdk"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "\K[^"]+' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "⚠️  Java version $JAVA_VERSION detected. Java 17+ required."
    echo "   sudo apt-get install openjdk-17-jdk"
    exit 1
fi

echo "✓ Java $JAVA_VERSION found"

# Build web assets
echo ""
echo "📦 Building web assets..."
pnpm build

# Sync to Android
echo ""
echo "🔄 Syncing to Android project..."
npx cap sync android

# Build APK
echo ""
echo "🔨 Building APK..."
cd android
./gradlew assembleDebug

# Show result
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ APK built successfully!"
    echo "📍 Location: $APK_PATH"
    echo "📊 Size: $APK_SIZE"
    echo ""
    echo "Next steps:"
    echo "1. Transfer to Android device: adb install $APK_PATH"
    echo "2. Or manually install via file manager"
else
    echo "❌ APK build failed"
    exit 1
fi
