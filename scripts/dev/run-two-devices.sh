#!/usr/bin/env bash
# Launch two independent Colapp.app instances pointing at separate user-data
# directories so you can validate peer-to-peer local sync on a single Mac.
#
# Usage:
#   scripts/dev/run-two-devices.sh                       # uses default sandbox
#   scripts/dev/run-two-devices.sh /tmp/colapp-test      # custom sandbox root
#
# After both windows open:
#   1. In each window: Settings -> Local Sync -> Configure storage.
#   2. Pick "Local" provider and paste the SHARED_SYNC path printed below.
#      (The path ends in `/sync` so the auto-`sync/` rewrite is skipped.)
#   3. Save in both windows. The first one to save writes manifest.json.
#   4. Edit something in window A, click "Sync now", then click "Sync now"
#      in window B -- the change should appear.

set -euo pipefail

APP_PATH="/Applications/Colapp.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Colapp.app not found at $APP_PATH" >&2
  echo "Install the DMG from apps/desktop/out/make/ first." >&2
  exit 1
fi

SANDBOX_ROOT="${1:-$HOME/colapp-test}"
DEVICE_A_DATA="$SANDBOX_ROOT/device-a"
DEVICE_B_DATA="$SANDBOX_ROOT/device-b"
SHARED_SYNC="$SANDBOX_ROOT/shared/sync"

mkdir -p "$DEVICE_A_DATA" "$DEVICE_B_DATA" "$SHARED_SYNC"

cat <<EOF
Sandbox root : $SANDBOX_ROOT
Device A data: $DEVICE_A_DATA
Device B data: $DEVICE_B_DATA
SHARED_SYNC  : $SHARED_SYNC        <-- paste this into BOTH windows
EOF

# `open -n` forces a brand-new process even if Colapp is already running.
# `--args ...` forwards CLI flags to main.ts (resolveConfiguredStoragePath).
COLANODE_DATA_DIR="$DEVICE_A_DATA" \
  open -n "$APP_PATH" --args "--storage-dir=$DEVICE_A_DATA"

# Tiny delay so the two windows don't race on Dock activation.
sleep 1

COLANODE_DATA_DIR="$DEVICE_B_DATA" \
  open -n "$APP_PATH" --args "--storage-dir=$DEVICE_B_DATA"

echo
echo "Both instances launched. Configure Local Sync in each window using the SHARED_SYNC path above."
