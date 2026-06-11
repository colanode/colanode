#!/usr/bin/env bash
# Launch two Colapp instances (device A + device B) in the local sync sandbox
# so you can verify meta type / page sync on one Mac without a second machine.
#
# Prerequisite: Colapp.app installed at /Applications/Colapp.app
# Uses the same sandbox as scripts/dev/sync-e2e.sh (default ~/colapp-test).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SANDBOX_ROOT="${1:-$HOME/colapp-test}"
SHARED_SYNC="$SANDBOX_ROOT/shared/sync"

echo "=== Meta type two-device demo ==="
echo "Sandbox : $SANDBOX_ROOT"
echo "Sync dir: $SHARED_SYNC"
echo ""

if [[ ! -d "/Applications/Colapp.app" ]]; then
  echo "Install Colapp first:" >&2
  echo "  cd $ROOT/apps/desktop && LOCAL_ONLY=true npm run package" >&2
  echo "  sudo cp -R out/Colapp-darwin-arm64/Colapp.app /Applications/" >&2
  exit 1
fi

if [[ ! -d "$SANDBOX_ROOT/device-a" ]]; then
  echo "No device-A sandbox yet. Run first-time setup:" >&2
  echo "  $ROOT/scripts/dev/sync-e2e.sh start" >&2
  echo "Then in Colapp: register, Settings → Local Sync → Local path:" >&2
  echo "  $SHARED_SYNC" >&2
  echo "Quit (Cmd+Q), then re-run this script." >&2
  exit 1
fi

if pgrep -f "Colapp.app.*colanode-storage-dir=$SANDBOX_ROOT/device-a" >/dev/null 2>&1; then
  echo "Quit the sandbox Colapp windows first (Cmd+Q), then re-run." >&2
  exit 1
fi

"$ROOT/scripts/dev/sync-e2e.sh" clone-and-run "$SANDBOX_ROOT"

cat <<EOF

=== 两台设备已启动（同一 Mac 沙箱）===

窗口 A — userData: $SANDBOX_ROOT/device-a
窗口 B — userData: $SANDBOX_ROOT/device-b  （克隆自 A，独立 deviceId）

【设备 B 首次】
1. Settings → Local Sync → Configure storage
2. Local 路径填: $SHARED_SYNC
3. Save → Sync now

【验证 Meta Types 同步】
设备 A:
  1. Settings → Meta Types → 打开 Page 元类型
  2. 或在 Space 里新建/编辑带 meta type 的 Page
  3. Settings → Local Sync → Sync now

设备 B:
  1. Sync now
  2. Settings → Meta Types → 应看到相同 page 列表
  3. 在 B 里改 page 字段 → Sync now → 回到 A Sync now → 应一致

【查看共享日志】
  $ROOT/scripts/dev/sync-e2e.sh inspect $SANDBOX_ROOT

【结束】
  两个窗口都 Cmd+Q 后:
  $ROOT/scripts/dev/sync-e2e.sh reset $SANDBOX_ROOT

EOF
