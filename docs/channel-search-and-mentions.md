# 频道消息搜索与 @ 提及（Channel Search & Mentions）

- **仓库**：`colanode/colanode`
- **当前分支**：`feat/channel_message_grouping`
- **文档日期**：2026-06-04
- **目标形态**：在频道（Channel）/ 会话中提供可用的消息全文搜索，以及可正确展示、可点击跳转的 `@` 资源提及能力。

---

## 1. 背景与意义

频道是 Colanode 协作体验的核心入口之一。用户在频道里高频地：

1. **检索历史消息**——快速回到某条讨论、决策或链接；
2. **`@` 引用资源**——把频道、页面、数据库等节点直接嵌入消息正文，形成跨内容的导航网络。

这两项能力直接决定了「信息能否被再次找到」和「内容之间能否互相连接」，是把零散消息沉淀为可复用知识的关键。本次工作修复了它们在本地优先（local-first）架构下的多处失效问题，让频道从「只能往下刷的消息流」升级为「可检索、可跳转的知识网络」。

---

## 2. 功能范围

### 2.1 范围（In Scope）

- 频道 / 线程内的消息正文全文搜索（FTS5）。
- `@` 提及资源（频道 / 页面 / 数据库等节点）的名称正确展示。
- `@` 提及资源支持点击跳转到目标节点。
- 兼容历史数据：修复前已写入的旧提及仍能正确显示与跳转。
- 修复提及在只读消息渲染中产生的 HTML 嵌套（`<div>` in `<p>`）告警。

### 2.2 非目标（Out of Scope）

- 跨工作区 / 全局搜索。
- 文档（document）正文搜索的索引修复（已识别同类隐患，见第 6 节，单独评估）。

---

## 3. 根因分析

### 3.1 FTS5 contentless 表无法回读列值

`node_texts` 与 `document_texts` 最初被创建为 **contentless** FTS5 虚拟表（`content='', contentless_delete=1`）。contentless FTS5 只保存倒排索引、**不保存原始列值**：

- `MATCH` 过滤可用（基于 rowid）；
- 但 `SELECT id / name / attributes` 或 `JOIN ... ON nodes.id = node_texts.id` 会返回 `NULL`。

因此：

- **频道搜索**：`innerJoin('node_texts', 'nodes.id', 'node_texts.id')` 因 `node_texts.id` 为 `NULL` 而匹配失败 → 搜索无结果。
- **提及资源检索**：`mention.search` 里 `where('node_texts.name', 'like', ...)` 因 `name` 为 `NULL` 而永远查不到资源（只有用户可被搜到）。

> 已通过 sqlite3 3.51.0 CLI 复现确认：contentless 表 `count(*)=1` 但 `SELECT id WHERE attributes match 'hello*'` 返回 `NULL`；改为普通 FTS5 表后 `INNER JOIN nodes` 能正确返回行。

### 3.2 提及缺少 `targetType` 属性

tiptap 的 `MentionExtension` 在插入时设置了 `targetType: props.type`，但 `addAttributes()` 只注册了 `id` 与 `target`，**未注册 `targetType`**，导致该属性从未被持久化。渲染时 `node.attrs.targetType` 恒为 `undefined`，资源判断分支恒为 `null`，所有提及都被当作「用户」处理 → 资源名显示为 `Unknown`。

### 3.3 头像元素在段落内的非法嵌套

只读消息渲染走 `NodeRenderer → ParagraphRenderer`（`<p>`）。提及里的 `Avatar` 经 `IconElement` / `EmojiElement` 渲染出根级 `<div>`，而 `<div>` 不能作为 `<p>` 的后代，触发 React 的 DOM 嵌套 / hydration 告警。`AvatarFallback` 早已是内联 `<span>`，说明头像本就设计为可内联，只是这几个兄弟组件实现不一致。

---

## 4. 实现方案

### 4.1 搜索索引（FTS5）

- `migrations/00007-create-node-texts-table.ts`：建表去掉 `content='', contentless_delete=1`，改为普通 FTS5 表
  `CREATE VIRTUAL TABLE node_texts USING fts5(id UNINDEXED, name, attributes);`。
- 新增 `migrations/00021-recreate-node-texts-table.ts`：为已有用户重建并回填索引——
  `DROP` 旧表 → 以非 contentless 方式重建 → 遍历 `nodes`，按节点注册表 `getNodeModel(type).extractText(id, attributes)` 重新写入 `node_texts`。`down` 还原为旧的 contentless 表。
- `migrations/index.ts`：注册 `00021` 迁移。
- `handlers/queries/messages/message-search.ts`：用 `$if` 链式构建查询，仅在有搜索词时 `innerJoin('node_texts')` 并 `where('node_texts.attributes', 'match', buildFtsQuery(q))`，同时消除原有的类型收窄报错。

### 4.2 提及属性持久化

- `packages/ui/src/editor/extensions/mention.tsx`：`addAttributes()` 补充
  `targetType: { default: null }`，使资源类型随提及一并持久化。

### 4.3 提及渲染（名称 + 跳转 + 兼容）

编辑器节点视图 `editor/views/mention.tsx` 与只读渲染器 `editor/renderers/mention.tsx` 采用一致策略：

- **双查兜底**：同时查询 `collections.users` 与 `collections.nodes`，用实际命中的集合判定 `isUser`；对缺失 `targetType` 的旧提及也能正确回退展示，名称取节点行扁平结构上的 `name`。
- **点击跳转**：资源类提及（非用户且节点存在）计算 `canNavigate`，`handleClick` 内 `preventDefault` / `stopPropagation` 后
  `navigate({ to: '/workspace/$userId/$nodeId', params: { userId, nodeId: target } })`；用户提及不跳转。

### 4.4 头像内联化

将以下组件根元素由 `<div>` 改为内联 `<span>`（与 `AvatarFallback` 对齐），尺寸通过 `inline-flex` / `inline-block` 保持：

- `components/icons/icon-element.tsx`
- `components/emojis/emoji-element.tsx`
- `components/avatars/avatar-image.tsx`（pending 占位态）

`img` 主分支本就是内联替换元素，无需改动；在 flex 容器中作为 flex item 行为不变，普通头像处视觉无差异。

---

## 5. 涉及文件

| 文件                                                                                    | 改动                            |
| --------------------------------------------------------------------------------------- | ------------------------------- |
| `packages/client/src/databases/workspace/migrations/00007-create-node-texts-table.ts`   | 改为非 contentless FTS5         |
| `packages/client/src/databases/workspace/migrations/00021-recreate-node-texts-table.ts` | 新增：重建并回填索引            |
| `packages/client/src/databases/workspace/migrations/index.ts`                           | 注册 00021 迁移                 |
| `packages/client/src/handlers/queries/messages/message-search.ts`                       | `$if` 链式查询 + 修复类型报错   |
| `packages/ui/src/editor/extensions/mention.tsx`                                         | 注册 `targetType` 属性          |
| `packages/ui/src/editor/views/mention.tsx`                                              | 双查兜底 + 点击跳转             |
| `packages/ui/src/editor/renderers/mention.tsx`                                          | 双查兜底 + 点击跳转（只读渲染） |
| `packages/ui/src/components/icons/icon-element.tsx`                                     | 根元素改内联 `<span>`           |
| `packages/ui/src/components/emojis/emoji-element.tsx`                                   | 根元素改内联 `<span>`           |
| `packages/ui/src/components/avatars/avatar-image.tsx`                                   | pending 占位改内联 `<span>`     |

---

## 6. 已知隐患与后续

- **`document_texts`（迁移 00011）仍为 contentless**，与 `node_texts` 同类隐患：若文档搜索依赖 `JOIN`/列回读会同样失效。建议参照 00007 / 00021 方案修复（更新建表 + 新增重建迁移，按文档注册表的 `extractText` 等价逻辑回填）。

---

## 7. 验证

- `packages/client` 与 `packages/ui` 均通过 `npx tsc --noEmit`。
- sqlite3 3.51.0 CLI 确认非 contentless 表 `INNER JOIN nodes` 可正确返回匹配行。
- 手动验证项：
  1. 工作区加载触发 00021 回填后，频道消息正文搜索可返回结果；
  2. `@` 资源显示真实名称（含修复前写入的旧提及）；
  3. 点击资源提及可跳转到目标节点；
  4. 用户提及正常显示且不跳转；
  5. 只读消息中不再出现 `<div>` in `<p>` 的嵌套告警。
