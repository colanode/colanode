# Page Meta Types

Workspace-level page property schemas backed by `database` nodes with `purpose: 'meta_type'`.

## Model

| Layer | Node | Key fields |
|-------|------|------------|
| Schema | `database` (`purpose: meta_type`) | `fields` |
| Instance | `page` | `metaTypeId`, `fields` |
| Collection | meta type database views | query pages by `metaTypeId` |

Pages stay in the Space tree. They are **not** children of the meta type database (unlike `record` nodes under `records` databases).

Each page's `metaTypeId` is set at creation time and **cannot be changed** afterward (`pageModel.canUpdateAttributes`).

## Defaults

On workspace init, `ensurePageMetaTypes` creates:

1. Hidden space `Meta Types` (`description: __colanode_meta_types__`) — hidden from the Spaces sidebar
2. Default meta type database named `Page`
3. Backfills missing or invalid `metaTypeId` on existing pages via `node.update` (creates syncable `node_updates`; SQLite is reconciled from YDoc when CRDT and SQLite drift)
4. When local sync is enabled, the first import runs before `ensurePageMetaTypes` so a remote default `Page` schema is not duplicated locally
5. If duplicate default `Page` meta types already exist, `consolidateDuplicatePageMetaTypes` keeps the schema with more fields / page references and removes the rest

The default `Page` meta type cannot be deleted (`databaseModel.canDelete`).

### Field defaults

Meta type field schemas may define an optional `default` on supported field types (text, number, boolean, select, etc.). New pages receive `resolveInitialPageFields()`:

1. Schema defaults from the meta type
2. View filter prefill (`generateFieldValuesFromFilters`) when creating from a filtered/board/calendar cell
3. Explicit `initialFields` overrides

Set defaults when creating a field in the meta type schema editor (optional **Default value** input).

## Queries

- `page.byMetaType` — SQL list via `nodes.meta_type_id` (VIRTUAL generated column + index; migration `00025`/`00026`)
- Meta type **collection views** load pages via TanStack DB (`metaTypeId` filter on `nodes` collection)
- Meta type views apply client-side filters/sorts in `applyCollectionViewQuery`
- Field value counts for Board/Table/List grouping use client-side `useFieldValueCounts`

## Supported views

Meta type databases support all standard database layouts:

| Layout | Notes |
|--------|-------|
| Table | Flat + grouped (select / multi-select); **Page ID** column |
| Gallery | Page cards; **Page ID** (click to copy) |
| List | Flat + grouped; **Page ID** under name |
| Board | Select, multi-select, collaborator, created_by columns; drag to update page fields |
| Calendar | Date field grouping; day cell **+** pre-fills the date on new pages; **created_at** grouping allows **+** on today’s cell |

## UI entry points

- Settings → Meta Types — manage schemas
- Space → Create page — pick meta type
- Page header — Properties panel (`PageMetadata`); meta type is shown read-only (chosen at create time)
- Meta type database — aggregated page list + Add page (with optional field prefill from view filters)

## Editing

Rows in a meta type view are real `page` nodes. Editing **Name** or schema fields in the view writes to the same `page.name` / `page.fields` as the page Properties panel.

### Relation and rollup fields

- **Relation** fields can point at either a `records` database (links records) or another **meta type** database (links pages). Search uses `record.search` or `page.byMetaType` respectively.
- **Rollup** aggregates number fields across linked records or pages (count works for both).
