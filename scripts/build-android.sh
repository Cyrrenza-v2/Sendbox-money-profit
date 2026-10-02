#!/bin/bash
set -euo pipefail
echo "=== VELTRION Android Build ==="
npm --prefix frontend install
npm --prefix frontend run build
cd frontend
npx cap sync android
cd android
./gradlew assembleDebug
echo "APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk"
