# Colanode 标签（Tags）功能实现指南 — 方案 A（Space 级共享标签库）

> 面向新加入工程师。本文汇总了实现标签功能所需的全部架构事实，每条事实都标注了**具体文件路径与行号**（基于撰写时的代码快照，行号可能随后续改动漂移，定位时以符号名为准）。
>
> 目标：在不破坏现有本地优先（local-first）+ CRDT 同步模型的前提下，为节点（page / channel / folder 等）增加**同一 Space 内共享的彩色标签**，并支持点击标签聚合出"带此标签的节点列表"。

---

## 0. 为什么是"方案 A：Space 级共享"

Colanode 的数据模型是**以 Space 为根的树**：每个内容节点都隶属某个 Space，没有"工作区全局单例"存储。离 workspace 最近的共享容器就是 **Space 节点**。

- 真正"跨 Space 全局共享"的标签库需要引入一个不属于任何 Space 的新实体，会牵动 core registry、server 端校验、同步协议全链路，风险与工作量都很高。
- **方案 A** 把标签库挂在 Space 节点的 `attributes` 上，复用现有节点 CRDT/同步/权限机制，落地最稳。局限是不同 Space 之间标签不互通，但同一 Space 内完全共享。

---

## 1. 节点数据模型

### 1.1 `nodes` 表结构
[packages/client/src/databases/workspace/migrations/00002-create-nodes-table.ts](packages/client/src/databases/workspace/migrations/00002-create-nodes-table.ts#L1-L39)

要点：
- `attributes` 列是 `text`（存 JSON 字符串），是节点所有业务字段的载体。
- `type` 与 `parent_id` 是**生成列**（`generatedAlwaysAs`），分别从 `json_extract(attributes, '$.type')` 与 `'$.parentId')` 派生并 `stored()`。
  - 含义：**你给 attributes 加的字段，无需改这张表**就能落库；但若想让某字段可被 SQL 直接索引/查询，需要新增一条迁移加生成列。
- `root_id` 必填，指向该节点所属树的根（通常是 Space）。
- `local_revision` / `server_revision` 支撑同步与冲突处理。
- 已建索引：`nodes_parent_id_type_index`（`parent_id`, `type`）。

### 1.2 客户端 schema 类型映射
[packages/client/src/databases/workspace/schema.ts](packages/client/src/databases/workspace/schema.ts#L30-L46) — `NodeTable` / `SelectNode` / `CreateNode` / `UpdateNode`。`attributes` 为 `ColumnType<string, string, string>`。

---

## 2. NodeModel 注册中心（core）

### 2.1 `NodeModel` 接口
[packages/core/src/registry/nodes/core.ts](packages/core/src/registry/nodes/core.ts#L58-L69)

```ts
export interface NodeModel {
  type: string;
  attributesSchema: z.ZodType;        // 每种节点自己的 Zod schema
  documentSchema?: z.ZodType;
  canCreate: (ctx) => boolean;
  canUpdateAttributes: (ctx) => boolean;
  canUpdateDocument: (ctx) => boolean;
  canDelete: (ctx) => boolean;
  canReact: (ctx) => boolean;
  extractText: (id, attributes) => NodeText | null;
  extractMentions: (id, attributes) => Mention[];
}
```

每种节点都有**独立的 `attributesSchema`**——没有所有节点共享的 base attributes schema。因此给"所有节点"加 `tagIds` 需要**逐个**修改各 node model 的 schema（见 2.3）。

### 2.2 类型联合与 `getNodeModel`
[packages/core/src/registry/nodes/index.ts](packages/core/src/registry/nodes/index.ts#L1-L80)
- `NodeAttributes` / `Node` 联合类型、`NodeBase`（id/rootId/parentId/created*/updated*）。
- `getNodeModel(type)` 按 `type` 返回对应 model，是创建/更新节点时取 schema 与权限函数的入口。

### 2.3 各节点 schema 定义位置（需要加 `tagIds` 的地方）
| 节点     | 文件                                                                                                 | schema 符号                |
| -------- | ---------------------------------------------------------------------------------------------------- | -------------------------- |
| channel  | [packages/core/src/registry/nodes/channel.ts](packages/core/src/registry/nodes/channel.ts#L8-L13)    | `channelAttributesSchema`  |
| folder   | [packages/core/src/registry/nodes/folder.ts](packages/core/src/registry/nodes/folder.ts#L7-L12)      | `folderAttributesSchema`   |
| database | [packages/core/src/registry/nodes/database.ts](packages/core/src/registry/nodes/database.ts#L16-L24) | `databaseAttributesSchema` |
| space    | [packages/core/src/registry/nodes/space.ts](packages/core/src/registry/nodes/space.ts#L14-L23)       | `spaceAttributesSchema`    |
| page     | packages/core/src/registry/nodes/page.ts                                                             | `pageAttributesSchema`     |

> 建议抽一个共享片段 `taggableAttributes = { tagIds: z.array(z.string()).optional() }` 并用 `.extend(...)` 合并进每个需要的 schema，避免重复且便于统一演进。

### 2.4 标签库存储位置（方案 A 核心）
把标签**定义字典**挂在 Space 上。复用现成的"选项"结构：

[packages/core/src/registry/nodes/field.ts](packages/core/src/registry/nodes/field.ts#L3-L8) — `selectOptionAttributesSchema`：
```ts
z.object({ id: z.string(), name: z.string(), color: z.string(), index: z.string() })
```

在 [space.ts](packages/core/src/registry/nodes/space.ts#L14-L23) 的 `spaceAttributesSchema` 增加：
```ts
tags: z.record(z.string(), tagAttributesSchema).optional(),
```
其中 `tagAttributesSchema` 直接对齐 `selectOptionAttributesSchema`（id/name/color/index），从而可复用现有的彩色徽章组件与颜色工具。

参考现有同构用法 `MultiSelectFieldAttributes`（database 的多选字段把选项存为 `options: Record<string, SelectOption>`），见 [field.ts](packages/core/src/registry/nodes/field.ts) 内 `multiSelectFieldAttributesSchema`。

---

## 3. attributes 的 CRDT 同步机制

节点 attributes 不是直接写 JSON，而是通过 **Yjs（YDoc）** 编码为 CRDT 更新，保证多端并发合并。核心都在：
[packages/client/src/services/workspaces/node-service.ts](packages/client/src/services/workspaces/node-service.ts)

- 创建节点：`createNode(...)` — [L61](packages/client/src/services/workspaces/node-service.ts#L61)
  - `const ydoc = new YDoc();` — [L84](packages/client/src/services/workspaces/node-service.ts#L84)
  - `const update = ydoc.update(model.attributesSchema, input.attributes);` — [L85](packages/client/src/services/workspaces/node-service.ts#L85)
  - 同一事务里写 `nodes` + `node_updates`（CRDT 增量）+ 视情况写 `mutations`（待同步到 server）+ `node_texts` + `node_references`。
- 更新节点：`updateNode<T>(nodeId, updater)` — [L409](packages/client/src/services/workspaces/node-service.ts#L409)，内部 `tryUpdateNode` 带乐观重试（`UPDATE_RETRIES_LIMIT`）。
  - 回放历史：`const ydoc = new YDoc(nodeState?.state)` 后逐条 `applyUpdate` — [L468](packages/client/src/services/workspaces/node-service.ts#L468)
  - 生成增量：`ydoc.update(model.attributesSchema, updatedAttributes)` — [L473](packages/client/src/services/workspaces/node-service.ts#L473)

含义（对标签实现至关重要）：
1. **务必通过 `nodes.update(id, draft => {...})` 这种 updater 修改 attributes**，让 schema 校验 + YDoc 增量 + 同步链路自动生效；不要绕过去直接写 SQL。
2. 给某节点打/取消标签 = 在 updater 里修改其 `tagIds` 数组。
3. 维护 Space 的标签字典（新增/改名/改色/删除）= 对 Space 节点做同样的 `nodes.update`。
   - UI 侧已有完全一致的范式可抄：数据库多选字段的选项增删改，见
     [packages/ui/src/components/databases/fields/select-field-options.tsx](packages/ui/src/components/databases/fields/select-field-options.tsx)
     与 [select-option-settings-popover.tsx](packages/ui/src/components/databases/fields/select-option-settings-popover.tsx)（用 `workspace.collections.nodes.update(...)` 改 `draft.fields[id].options`）。

---

## 4. `node_references` 表 — 标签聚合的索引基础

[packages/client/src/databases/workspace/schema.ts](packages/client/src/databases/workspace/schema.ts#L112-L123)
```ts
interface NodeReferenceTable {
  node_id;       // 来源节点
  reference_id;  // 被引用的目标
  inner_id;      // 同一来源内多条引用的去重键
  type;          // 引用类别，如 'mention'
  created_at;
  created_by;
}
```

现有用途：节点里的 **mention** 会在 `createNode` 时被 `extractMentions` 提取并写入一行 `type: 'mention'` 的引用（见 node-service `createNode` 事务中对 `node_references` 的插入；更新时通过 `checkMentionChanges` 增量维护）。

**对标签的复用方式：**
- 把每个"节点→标签"关系写成一行 `node_references`：`node_id = 节点`，`reference_id = tagId`，`type = 'tag'`。
- 这样"点击标签 → 列出带此标签的节点"就是一条
  `select node_id from node_references where reference_id = :tagId and type = 'tag'`，
  无需在 `nodes` 表上扫 JSON。
- 维护时机：在节点 attributes 的 `tagIds` 变化时，比照 mention 的 `extractMentions` / `checkMentionChanges` 模式做增量 upsert/删除。可考虑在 `NodeModel` 上新增一个 `extractTags(id, attributes)` 钩子，或直接在 `tagIds` 变更处维护引用行。

> 备选：因为 `type`/`parent_id` 是 `nodes` 的生成列，也可再加一条迁移把 `tagIds` 物化为可查询结构。但**优先复用 `node_references`**，与现有 mention/backlink 机制一致，改动面最小。

---

## 5. UI：标签栏插入位置（标题下方）

### 5.1 页面容器
[packages/ui/src/components/pages/page-container.tsx](packages/ui/src/components/pages/page-container.tsx#L1-L22)

当前结构：
```tsx
<div className="flex flex-row items-start gap-4">
  <div className="min-w-0 flex-1">
    <Document node={page} canEdit={canEdit} autoFocus="start" />
    <NodeBacklinks nodeId={page.id} />
  </div>
  <NodeOutline documentId={page.id} />
</div>
```
**标签栏应插在 `<Document>` 之前**（正文上方）。面包屑由外层 `Container` 渲染，标签栏正好落在"面包屑与正文之间"。可新建 `NodeTagBar`（参照同目录 `NodeBacklinks` / `NodeOutline` 的写法与数据获取方式）。

### 5.2 外层容器与面包屑
- [packages/ui/src/components/layouts/containers/container.tsx](packages/ui/src/components/layouts/containers/container.tsx#L62-L69)：`type === 'full'` 时渲染 `breadcrumb`（L62），其下渲染 `children`（L69，即 PageContainer）。
- 面包屑单项：[packages/ui/src/components/layouts/containers/breadcrumb-item.tsx](packages/ui/src/components/layouts/containers/breadcrumb-item.tsx#L1-L17)
- 页面面包屑项：packages/ui/src/components/pages/page-breadcrumb-item.tsx

### 5.3 可复用的标签视觉与选择器
- 彩色徽章：`packages/ui/src/components/databases/fields/select-option-badge.tsx`（`SelectOptionBadge name/color`）。
- 选项选择 + 即时新建：[select-field-options.tsx](packages/ui/src/components/databases/fields/select-field-options.tsx)（基于 `Command` 列表，含"Create"项与随机色 `getRandomSelectOptionColor`）。
- 颜色集合与样式工具：`packages/ui/src/lib/databases.ts`（`selectOptionColors` / `getSelectOptionLightColorClass` 等）。

---

## 6. 建议实现阶段（方案 A）

**阶段 ①：schema + 打标签 + 显示彩色标签**
1. core：新增 `tagAttributesSchema`（对齐 selectOption）；`spaceAttributesSchema.tags`；各 taggable 节点 schema 加 `tagIds`。
2. UI：`NodeTagBar` 显示已选标签（彩色徽章），插入 `PageContainer` 正文上方。
3. 打标签：`workspace.collections.nodes.update(node.id, draft => draft.tagIds = ...)`。

**阶段 ②：标签选择器 + Space 标签管理**
1. 复用 `SelectFieldOptions` 范式做标签选择/新建/改名/改色/删除（写到 Space 的 `attributes.tags`）。

**阶段 ③：点击标签聚合列表**
1. `tagIds` 变更时维护 `node_references`（`type: 'tag'`）。
2. 新增按 `reference_id + type='tag'` 查询的列表视图/路由，点击标签跳转。

---

## 7. 实现纪律（务必遵守）

- 所有 attributes 改动一律走 `nodes.update(...)` updater，让 schema 校验 + CRDT + 同步生效，禁止绕过写 SQL。
- core 的 schema 改动会同时影响 server 端校验（server 复用 `@colanode/core`），改 schema 后需在 desktop 与同步链路一并验证。
- 给多个 node model 加字段时抽共享片段，避免散落重复。
- 优先复用既有机制（`node_references`、`SelectOption`、`SelectFieldOptions`、`SelectOptionBadge`），减少新概念。
