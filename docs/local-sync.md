# Local Sync（纯本地多设备同步）

> 适用范围：`LOCAL_ONLY` 桌面端（Colapp）。不依赖 Colanode server，两台或多台本机/局域网设备通过共享存储互相同步 workspace 数据。

## 1. 这是什么

Local Sync 让一个 workspace 在多台桌面设备之间保持一致，**不需要后端服务**。每台设备在本地保留完整的 SQLite 数据库，按固定间隔把自己的修改写到一个共享存储（本地目录 / S3 兼容桶 / GitHub 仓库），并从同一个共享存储拉取其他设备的修改。所有合并由 CRDT（Yjs）在本地完成。

核心心智模型：

- **同步的是操作日志（op-log），不是数据库文件**
- SQLite 只是各端本地的「投影」，可以任意时间从 op-log 重建
- 没有中央协调者，没有冲突解决器——CRDT 的合并是确定且可交换的

## 2. 适用场景与限制

适用：
- 同一个人在多台 Mac/Windows 之间同步个人 workspace
- 两到几位用户之间共享一个 workspace（共享存储能互相访问即可）
- 想要离线优先 + 间歇连网同步的工作流

限制：
- **身份必须一致**：所有设备必须使用同一对 `workspaceId / userId`。新装的两台 Colapp 各自生成独立身份，无法直接互相同步——需要走「克隆设备」流程（见 §6）
- **不是实时协作**：同步间隔 10 秒，不是 Y.js 的 WebSocket 实时频道
- **共享存储必须可写**：S3 桶/本地目录的写权限决定了谁能推送
- **mutations 在 `LOCAL_ONLY` 下被禁用**：所有改动直接走本地 CRDT 应用路径

## 3. 数据流总览

```
设备 A                       共享存储                    设备 B
─────────                    ─────────                  ─────────
本地 SQLite                                              本地 SQLite
  │                                                       │
  │ exportLocal() 每 10s                                  │ importRemote() 每 10s
  ▼                                                       ▲
读 node_updates /         workspaces/<wsId>/             列出 devices/* 前缀
document_updates /        devices/<deviceId>/             过滤掉自己 + 已 applied
node_reactions /          <ULID>.jsonl                    下载 jsonl
tombstones (按游标)            │                          │
打包成一个 .jsonl              │                          ▼
上传                           │                          应用 Yjs binary
推进 export.* 游标             │                          标记 applied.<key>=1
                                                          ↓
                                                       eventBus.publish
                                                       UI 自动刷新
```

每台设备只往**自己的 `deviceId` 前缀**里 append 文件，永不修改别人的目录——这是「append-only + 单写者」模式，避免了任何写冲突。

## 4. 存储布局

共享存储的根目录是 **workspace-scoped** 的，一个根目录可以同时承载多个 workspace：

```
<sync-root>/
└── workspaces/
    ├── <workspaceIdA>/
    │   ├── manifest.json                      # workspace A 的身份卡
    │   ├── devices/
    │   │   ├── <deviceIdA1>/
    │   │   │   ├── 01ktk39js20ze...ud.jsonl   # 一次 sync 周期产出的一批操作
    │   │   │   ├── 01ktk3a9ztqdr...ud.jsonl
    │   │   │   └── ...
    │   │   └── <deviceIdA2>/
    │   │       └── ...
    │   └── files/
    │       └── <fileId>.<ext>                  # 内容寻址的附件 blob
    └── <workspaceIdB>/
        ├── manifest.json                      # workspace B 的身份卡（与 A 互不干扰）
        ├── devices/...
        └── files/...
```

`manifest.json` 示例：

```json
{
  "workspaceId": "01ktk2z22ntkz42rd9j3rqd8arwc",
  "userId": "01ktk2z22ntkz42rd9j3rqd8asus",
  "name": "My Workspace",
  "createdAt": "2026-06-08T07:48:58.265Z",
  "createdByDeviceId": "01ktk39jrh6m1wy7b9rmm6gzdede"
}
```

第一次配置同步时，每个 workspace 的第一台设备在自己的 `workspaces/<wsId>/` 子树下写入 manifest；之后任何设备 attach 到这个 workspace 时，本地 `workspaceId/userId` 必须与该子树下的 manifest 完全相等，否则同步会停在 `Local workspace identity does not match the shared manifest` 错误。**不同 workspace 共享同一根目录不会冲突**，它们各自只看自己的 `workspaces/<自己 wsId>/` 子树。

> 旧版本曾把 manifest 放在根目录（`<sync-root>/manifest.json`）。新版本会在首次 attach 时自动把旧布局迁移到 `workspaces/<wsId>/manifest.json`，并删除根级文件。这是一次性、幂等的迁移，无需手工处理。

`.jsonl` 每行一条 [`SyncRecord`](../packages/client/src/services/workspaces/cloud-sync-service.ts)：

```jsonl
{"kind":"node.update","data":{"id":"...","nodeId":"...","data":"<base64 Yjs update>",...}}
{"kind":"document.update","data":{...}}
{"kind":"node.delete","data":{...}}        // tombstone
{"kind":"node.reaction","data":{...}}
```

## 5. 关键组件

| 位置                                                                                                                                    | 职责                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`packages/client/src/services/workspaces/cloud-sync-service.ts`](../packages/client/src/services/workspaces/cloud-sync-service.ts)     | 调度器：定时 import/export、manifest 校验、游标管理                   |
| [`packages/client/src/services/backup/`](../packages/client/src/services/backup)                                                        | `StorageProvider` 抽象 + local/s3/github 三种实现                     |
| [`packages/client/src/services/workspaces/workspace-manifest.ts`](../packages/client/src/services/workspaces/workspace-manifest.ts)     | manifest 读写与身份校验                                               |
| [`packages/client/src/services/app-meta.ts`](../packages/client/src/services/app-meta.ts)                                               | `LocalSyncConfig` 持久化（`sync-config.json`）                        |
| [`apps/desktop/src/main.ts`](../apps/desktop/src/main.ts)                                                                               | `local-sync-configure` IPC、路径规范化                                |
| [`packages/ui/src/components/workspaces/workspace-local-sync.tsx`](../packages/ui/src/components/workspaces/workspace-local-sync.tsx)   | 设置 → Local Sync 卡片（状态、Sync now、Reconfigure、Pause、Disable） |
| [`packages/ui/src/components/local-sync/storage-provider-form.tsx`](../packages/ui/src/components/local-sync/storage-provider-form.tsx) | 配置表单（Local/S3/GitHub）                                           |

### 5.1 游标与幂等

每个 workspace 数据库的 `sync_state` 表存两类键：

- `export.<source>` —— 出站游标，记录该 source 已导出到哪一行 ULID
  - `export.node_updates`、`export.document_updates`、`export.tombstones`、`export.node_reactions`
- `applied.<key>` —— 入站标记，记录某个远端 jsonl key 已经被应用过

效果：
- 同一个 jsonl 被反复 import 无副作用
- 一台设备崩溃 / 重启 / 重新连上后，从游标继续 export，不重发也不漏发
- **首次切换到一个全新的共享存储**时，`ensureInitialized()` 会发现自己在新存储里没有任何文件，于是清空 `export.*` 游标，让下一次 exportLocal 重新发出完整 op-log（否则切了存储就只剩 manifest 没数据）

### 5.2 同步周期

`CloudSyncService.sync()` 每 10 秒跑一次，先 import 后 export：

1. **import**：list 远端所有 `devices/*/*.jsonl` → 过滤掉自己的前缀和已 applied 的 → 按 ULID 排序 → 下载、解析、按依赖顺序 apply（node.update → document.update → reaction → delete）→ 标记 applied
2. **export**：分别从 4 张表按 `export.*` 游标拉新数据 → 全部打包成一个 jsonl → 上传到 `devices/<myDeviceId>/<新 ULID>.jsonl` → 推进游标
3. **附件**：`exportFiles()` 把本地新增的 file blob 上传到 `workspaces/<wsId>/files/<fileId>.<ext>`，downloads 用 `DownloadStatus` 跟踪

## 6. 如何让两台设备同步

### 6.1 首次配置（设备 A）

1. 打开 Colapp，注册本地账号并创建一个 workspace
2. 进入 Settings → Local Sync → **Configure storage**
3. 选择存储方式：
   - **Local**：填一个目录路径（可以是 iCloud Drive / OneDrive / 局域网共享盘上的任意目录；可以是已经被其他 workspace 用过的同步根目录——不同 workspace 互不干扰）
   - **S3**：填 endpoint / region / bucket / 访问密钥
   - **GitHub**：填 owner / repo / PAT
4. Save。设备 A 立即在 `workspaces/<本 wsId>/` 子树下写入 manifest + 第一批 jsonl

> 多个 workspace 可以共用同一个根目录：每个 workspace 只看 `workspaces/<自己 wsId>/` 子树，配置时不需要为每个 workspace 单独建子文件夹。

> 选 Local 时如果填的是一个还没有任何 manifest 的全新目录，主进程会在路径末尾追加 `sync/` 子目录避免污染。已经存在 `workspaces/` 的目录会被识别为同步根，**不再追加**。

### 6.2 让第二台设备加入

`LOCAL_ONLY` 模式下每台设备本地都有独立的 `workspaceId/userId`，不会自动 adopt 远端身份。让另一台设备加入同一个 workspace，目前最简单的路径是：

**克隆设备身份（推荐）**

1. 关闭设备 A
2. 把设备 A 的 `userData` 整个拷到设备 B（Mac 默认在 `~/Library/Application Support/Colapp-Local/`）
3. 删除拷过去的 `sync-config.json`（让 B 重新生成自己的 `deviceId`，避免两台共用同一日志前缀）
4. 启动 Colapp（自动进入 A 已登录的 workspace）
5. Settings → Local Sync → Configure storage → 填**同一个**共享路径 → Save
6. 因为 manifest 里的 `workspaceId/userId` 和 B 本地完全一致，校验通过，开始双向同步

> 也可以走「同一根目录 + 多 workspace」模式：两台设备各自有独立 workspace，但共用一个 iCloud Drive 目录。这种情况下他们不会互相同步，只是各自的 workspace 跨自己的多设备时复用同一根目录。

> 目前没有「在 UI 里浏览同步根目录下所有 workspace 让用户选择加入」的功能；后续可能加入。

### 6.3 日常使用

- 周期同步：每 10 秒自动一次
- 手动触发：Settings → Local Sync → **Sync now**
- 暂停：**Pause**（暂停后只有手动 Sync now 才会跑）
- 切换存储：**Reconfigure**（会触发首次配置的 manifest 校验 + 游标重置逻辑）
- 完全停用：**Disable**（清掉 `LocalSyncConfig`，但本地数据原样保留）

UI 状态卡片会显示：
- 当前 Device ID、Storage 描述（local 路径 / s3 桶 / github repo）
- Last export / Last import 时间和摘要（各类型记录条数）
- Last error（若失败）

## 7. 本机端到端测试脚本

仓库内附带 [`scripts/dev/sync-e2e.sh`](../scripts/dev/sync-e2e.sh)，用于在**一台 Mac 上**模拟两个设备：

```bash
# 完整流程
scripts/dev/sync-e2e.sh reset           # 清沙箱
scripts/dev/sync-e2e.sh start           # 启动设备 A（仅 A）
# 在 GUI 里完成注册、建 workspace、配 Local Sync 到 ~/colapp-test/shared/sync、Sync now，然后 Cmd+Q
scripts/dev/sync-e2e.sh clone-and-run   # 克隆 A→B，同时打开两个窗口
# 在新的 B 窗口里 Configure 到同一路径、Sync now → 双向同步
scripts/dev/sync-e2e.sh inspect         # 列出共享目录下的所有文件
```

沙箱位于 `~/colapp-test/`，包含 `device-a/`、`device-b/`、`shared/sync/` 三个子目录。脚本通过 `COLANODE_DATA_DIR` 环境变量和 `--storage-dir=` CLI 参数把两个 Colapp 进程指向不同的 userData。

`clone-and-run` 做了两件关键事：
1. `cp -R device-a device-b`：克隆身份，保证 `workspaceId/userId` 一致
2. 删除 B 的 `sync-config.json` 并清空 `sync_state` 里的 `export.*` / `applied.*`：让 B 生成新 deviceId 并首次同步时重发 + 重拉全量

## 8. 已修复的实战坑

- **路径自动重写吞数据**：早期 `normalizeLocalSyncStorage` 无条件追加 `sync/`，导致用户复选已有同步根时整个目录被「错位」到新的子层。修复：检测 `manifest.json` 或 `workspaces/` 存在则跳过追加（[`apps/desktop/src/main.ts`](../apps/desktop/src/main.ts) 的 `looksLikeSyncRoot`）
- **切换存储只剩 manifest**：切到新存储后 `export.*` 游标还停留在旧存储位置，于是只发了 manifest 没发数据。修复：`ensureInitialized()` 发现自己在新存储里前缀为空时清空 export 游标
- **runtime FOREIGN KEY 报错**：`better-sqlite3` 默认开启外键，而 `applyRemoteNodeUpdate` 故意「先插 `node_updates` 后插 `nodes`」，且所有级联删除走 `deleteNodeRelations` 显式清理。修复：[`apps/desktop/src/main/kysely-service.ts`](../apps/desktop/src/main/kysely-service.ts) 显式 `database.pragma('foreign_keys = OFF')`
- **tombstone 自删**：`applyRemoteNodeDelete` 原本先插 tombstone 再调 `deleteNodeRelations`，而后者会清 tombstones 表。修复：调整顺序，先 `deleteNodeRelations` 再插 tombstone

## 9. 测试覆盖

- 集成测试：[`packages/client/test/cloud-sync.test.ts`](../packages/client/test/cloud-sync.test.ts)（4/4 通过）
  - 两个 fake workspace 共享 workspaceId/userId、不同 deviceId、共享 LocalStorageProvider
  - 覆盖：创建、幂等（忽略自身日志）、后续更新收敛、删除（tombstone 跨设备传播）
  - 使用 `node:sqlite` + 自写 `SqliteDialect` shim 绕开 electron ABI 限制（[`packages/client/test/helpers/sqlite.ts`](../packages/client/test/helpers/sqlite.ts)）
- 手工端到端：见 §7，通过双开真实 Colapp.app 验证 UI → SQLite → 共享存储 → UI 全链路

## 10. 排错速查

| 现象                                                         | 可能原因                                                              | 处理                                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Status: Error，"identity does not match the shared manifest" | 本地 `workspaceId/userId` 与 `workspaces/<wsId>/manifest.json` 不一致 | 克隆设备身份流程加入；或删掉远端那个 wsId 子树让自己成为新 authority |
| 两个不同的 workspace 配同一个目录会冲突吗                    | 不会，新版本是 per-workspace 子树，互不干扰                           | 直接配；首次启动会自动迁移旧的根级 manifest                          |
| Sync now 后共享目录只多了 manifest，没有 jsonl               | 本地没有新数据，或游标已经走到表尾                                    | 在 A 加内容再 Sync；若切换了存储应自动重置                           |
| B 收到了数据但 UI 不显示                                     | UI hook 未 invalidate（罕见）                                         | Cmd+Q 重启窗口；记下复现步骤反馈                                     |
| Import error: FOREIGN KEY constraint failed                  | 旧版本，未关闭 SQLite 外键                                            | 升级到本次修复后的构建                                               |
| 两台都在写，前缀互相覆盖                                     | 两台共用同一个 deviceId（克隆时未删 sync-config.json）                | 在 B 上删 `sync-config.json` 并 Reconfigure                          |
| 旧版本升级后，原来根目录的 `manifest.json` 不见了            | 已被自动迁移到 `workspaces/<wsId>/manifest.json`                      | 正常现象，无需处理                                                   |

## 11. 后续改进方向

- UI 实时刷新：`applyRemoteNodeUpdate` 已发 `eventBus.publish('node.created'/'node.updated')`，但部分 query hook 的订阅粒度不够；待逐一审查
- 「浏览同步根目录」UI：列出 `workspaces/*/manifest.json` 让用户选择加入哪一个 workspace（当前只支持克隆设备身份）
- 压缩 / 归档历史 jsonl（log compaction）以控制远端体积
- 端到端加密：当前 jsonl 是明文 Yjs binary，敏感场景需要在 StorageProvider 层加一层信封加密
- 自动冲突告警：CRDT 不会产生「冲突」，但删除/恢复这类语义边界还是值得给用户提示
