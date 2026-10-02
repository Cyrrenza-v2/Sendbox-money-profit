#!/bin/bash
set -euo pipefail
echo "=== Starting VELTRION Android Build Process ==="
npm --prefix frontend run build
if ! command -v npx >/dev/null 2>&1; then echo "npx is required"; exit 1; fi
npx cap sync android
cd android
./gradlew assembleDebug
echo "=== Build Complete: APK generated successfully ==="
