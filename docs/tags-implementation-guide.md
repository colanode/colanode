# Colanode 标签（Tags）功能 — 已实现架构说明

> 标签功能已在 `feat/sync_local` 分支落地。本文描述**当前实现**，供维护与扩展时参考。

## 概览

- **标签库**：workspace 级共享，存于 app 库 `workspaces.tags`（JSON）
- **打标签**：节点 `attributes.tagIds`（page / channel / folder / database）
- **索引**：`node_references` 表，`type = 'tag'`，用于聚合查询
- **UI**：节点顶部 `NodeTagBar`、Settings → Tags 管理、`/tags/$tagId` 聚合页、命令面板 `#标签名` 搜索

---

## 数据模型

### Workspace 标签库

| 位置 | 说明 |
|------|------|
| `packages/client/src/databases/app/migrations/00010-add-workspace-tags-column.ts` | 迁移：`workspaces.tags` 列 |
| `packages/core/src/registry/nodes/tag.ts` | `tagAttributesSchema` / `TagAttributes`（id, name, color, index） |
| `packages/client/src/types/workspaces.ts` | `Workspace.tags?: Record<string, TagAttributes>` |

### 节点 tagIds

各 taggable 节点 schema 含可选 `tagIds: string[]`：

- `packages/core/src/registry/nodes/page.ts`
- `packages/core/src/registry/nodes/channel.ts`
- `packages/core/src/registry/nodes/folder.ts`
- `packages/core/src/registry/nodes/database.ts`

### node_references 索引

- 创建/更新节点时：`packages/client/src/lib/tags.ts` → `buildNodeReferencesToCreate` / `applyNodeReferenceUpdates`
- 接入点：`packages/client/src/services/workspaces/node-service.ts`
- 启动回填：`packages/client/src/lib/tag-references-sync.ts`（`syncTagReferences`）

---

## Client 操作

| 操作 | 类型 | 文件 |
|------|------|------|
| 更新标签库 | `workspace.tags.update` | `packages/client/src/handlers/mutations/workspaces/workspace-tags-update.ts` |
| 按标签列节点 | `tag.nodes.list` | `packages/client/src/handlers/queries/tags/tag-nodes-list.ts` |

删除标签时，`workspace-tags-update` handler 会调用 `cleanupDeletedWorkspaceTags`，从各节点 `tagIds` 与 `node_references` 中移除。

---

## UI 组件

| 组件 | 路径 | 用途 |
|------|------|------|
| `NodeTagBar` | `packages/ui/src/components/nodes/node-tag-bar.tsx` | 节点顶部标签栏 |
| `WorkspaceTagOptions` | `packages/ui/src/components/workspaces/workspace-tag-options.tsx` | 选择/新建标签 |
| `WorkspaceTagSettingsPopover` | `packages/ui/src/components/workspaces/workspace-tag-settings-popover.tsx` | 改名/改色/删除 |
| `WorkspaceTagsContainer` | `packages/ui/src/components/workspaces/workspace-tags-container.tsx` | Settings 标签管理页 |
| `TagNodesContainer` | `packages/ui/src/components/tags/tag-nodes-container.tsx` | 标签聚合列表页 |
| `TagLink` | `packages/ui/src/components/tags/tag-link.tsx` | 可点击跳转的标签徽章 |

路由：

- `/workspace/$userId/settings/tags` — 标签管理
- `/workspace/$userId/tags/$tagId` — 带此标签的节点列表

命令面板：`packages/ui/src/components/layouts/global-command-palette.tsx`，输入 `#` 前缀搜索标签。

---

## 遗留迁移

`packages/client/src/lib/workspace-tags.ts` 中的 `migrateLegacySpaceTags` 在 workspace 初始化时运行，将旧版 Space 节点 `attributes.tags` 合并进 `workspaces.tags`（一次性）。

---

## 实现纪律

1. 节点 `tagIds` 变更一律走 `workspace.collections.nodes.update` / `NodeService.updateNode`，禁止直接写 SQL。
2. Workspace 标签库变更走 `setWorkspaceTags` + `collections.workspaces` 的 `onUpdate`（`packages/ui/src/lib/workspaces.ts`）。
3. 扩展 taggable 类型时：加 schema `tagIds`、挂 `NodeTagBar`、确认 `TAGGABLE_NODE_TYPES` 与 `tag-references-sync` 一致。

---

## 未实现（可选后续）

- Database 视图按标签筛选记录
- Record 节点打标签
- 标签跨 workspace 同步（标签库在 app 库，随 workspace 本地存储，非 CRDT 节点）
