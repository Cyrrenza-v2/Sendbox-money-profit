#!/bin/bash
set -euo pipefail
echo "=== VELTRION FINAL PRODUCTION LAUNCH SEQUENCE ==="
: "${PRODUCTION_DATABASE_URL:?Production database URL missing. Aborting launch.}"
: "${SUPABASE_URL:?Supabase URL missing. Aborting launch.}"
if [ "${REAL_TRADING_ENABLED:-false}" = "true" ]; then echo "ERROR: REAL_TRADING_ENABLED must remain false for initial launch."; exit 1; fi
npm run test
npm run build
echo "=== Pre-flight checks passed with REAL trading paused. ==="
