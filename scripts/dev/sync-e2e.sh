#!/usr/bin/env bash
# End-to-end harness for verifying peer-to-peer local sync on ONE Mac, with
# two Colapp instances pointing at separate user-data directories but the
# SAME shared sync folder.
#
# Why three sub-commands and not "just open two windows": each fresh Colapp
# instance generates its own random workspaceId/userId. Two random identities
# cannot sync, because the workspace manifest enforces identity equality. So
# we set up device-A first, clone its user-data directory into device-B (now
# both share the same workspace/user identity), and only then launch both.
#
# Usage:
#   scripts/dev/sync-e2e.sh start              # step 1: launch device-A only
#   scripts/dev/sync-e2e.sh clone-and-run      # step 2: clone A->B, open both
#   scripts/dev/sync-e2e.sh reset              # nuke the whole sandbox
#   scripts/dev/sync-e2e.sh inspect            # show files in shared sync dir
#
# Optional first positional arg overrides the sandbox root (default
# ~/colapp-test).

set -euo pipefail

APP_PATH="/Applications/Colapp.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Colapp.app not found at $APP_PATH" >&2
  echo "Install the DMG from apps/desktop/out/make/ first." >&2
  exit 1
fi

SUBCMD="${1:-help}"
SANDBOX_ROOT="${2:-$HOME/colapp-test}"
DEVICE_A_DATA="$SANDBOX_ROOT/device-a"
DEVICE_B_DATA="$SANDBOX_ROOT/device-b"
SHARED_SYNC="$SANDBOX_ROOT/shared/sync"

launch_instance() {
  local data_dir="$1"
  COLANODE_DATA_DIR="$data_dir" \
    open -n "$APP_PATH" --args "--colanode-storage-dir=$data_dir"
}

case "$SUBCMD" in
  start)
    mkdir -p "$DEVICE_A_DATA" "$SHARED_SYNC"
    cat <<EOF
Step 1 — launching device A only.
  Sandbox root : $SANDBOX_ROOT
  Device A data: $DEVICE_A_DATA
  SHARED_SYNC  : $SHARED_SYNC

In the Colapp window that opens:
  1. Register a local account and create a workspace.
  2. Open Settings -> Local Sync -> Configure storage.
  3. Pick "Local" and paste:
       $SHARED_SYNC
     (the path ends with /sync so the auto-rewrite is skipped)
  4. Save. Add a page or two so there is something to sync.
  5. Click "Sync now". You should see manifest.json + a .jsonl appear under
       $SHARED_SYNC/workspaces/<wsId>/devices/<deviceId>/
  6. QUIT this Colapp window (Cmd+Q) before running step 2.

Then run:
  $0 clone-and-run ${2:+"$SANDBOX_ROOT"}
EOF
    launch_instance "$DEVICE_A_DATA"
    ;;

  clone-and-run)
    if [[ ! -d "$DEVICE_A_DATA" ]]; then
      echo "Device A data dir not found at $DEVICE_A_DATA — run '$0 start' first." >&2
      exit 1
    fi
    if pgrep -f "Colapp.app.*storage-dir=$DEVICE_A_DATA" >/dev/null 2>&1; then
      echo "Device A appears to still be running. Quit it (Cmd+Q) before cloning." >&2
      exit 1
    fi

    echo "Step 2 — cloning device A into device B (same workspace identity)..."
    rm -rf "$DEVICE_B_DATA"
    cp -R "$DEVICE_A_DATA" "$DEVICE_B_DATA"

    # Drop B's local sync config so it has to re-init its own deviceId against
    # the shared sync folder (otherwise both devices would share a deviceId
    # and would clobber each other's append-only log prefix).
    rm -f "$DEVICE_B_DATA/sync-config.json"
    # Also clear B's export/import cursors so it re-emits its op-log and
    # re-imports A's log on first sync.
    find "$DEVICE_B_DATA" -name '*.db' -print0 | while IFS= read -r -d '' db; do
      sqlite3 "$db" "DELETE FROM sync_state WHERE key LIKE 'export.%' OR key LIKE 'applied.%';" 2>/dev/null || true
    done

    cat <<EOF
Done cloning. Launching both windows now.

In the NEW device-B window:
  1. Open Settings -> Local Sync -> Configure storage.
  2. Pick "Local" and paste the SAME path:
       $SHARED_SYNC
  3. Save. (manifest.json already exists; identity will match because B is a
     clone of A, so the manifest check passes.)
  4. Click "Sync now". B should pull in everything you created in A.

Then to verify the round trip:
  - In B, create another page, click Sync now.
  - In A, click Sync now. The page from B should appear.

Sandbox layout:
  Device A data: $DEVICE_A_DATA
  Device B data: $DEVICE_B_DATA  (clone of A, new sync-config + reset cursors)
  SHARED_SYNC  : $SHARED_SYNC
EOF
    launch_instance "$DEVICE_A_DATA"
    sleep 1
    launch_instance "$DEVICE_B_DATA"
    ;;

  inspect)
    if [[ ! -d "$SHARED_SYNC" ]]; then
      echo "No shared sync dir at $SHARED_SYNC" >&2
      exit 1
    fi
    echo "Files under $SHARED_SYNC:"
    find "$SHARED_SYNC" -type f | sort | while read -r f; do
      printf "  %s\t(%s bytes)\n" "${f#$SHARED_SYNC/}" "$(stat -f %z "$f")"
    done
    ;;

  reset)
    if pgrep -f "Colapp.app.*storage-dir=$SANDBOX_ROOT" >/dev/null 2>&1; then
      echo "Quit all sandbox Colapp windows first (Cmd+Q)." >&2
      exit 1
    fi
    echo "Removing $SANDBOX_ROOT ..."
    rm -rf "$SANDBOX_ROOT"
    echo "Done."
    ;;

  help|*)
    cat <<EOF
Usage: $0 <subcommand> [sandbox-root]

Subcommands:
  start              Launch device-A only. Set up workspace + Local Sync, then quit.
  clone-and-run      Clone device-A's data into device-B, launch both. Configure
                     Local Sync in B pointing at the same shared folder.
  inspect            List files inside the shared sync directory.
  reset              Delete the sandbox (must quit all sandbox windows first).

sandbox-root defaults to ~/colapp-test
EOF
    ;;
esac
