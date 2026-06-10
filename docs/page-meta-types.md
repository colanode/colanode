# Page Meta Types

Workspace-level page property schemas backed by `database` nodes with `purpose: 'meta_type'`.

## Model

| Layer | Node | Key fields |
|-------|------|------------|
| Schema | `database` (`purpose: meta_type`) | `fields` |
| Instance | `page` | `metaTypeId`, `fields` |
| Collection | meta type database views | query pages by `metaTypeId` |

Pages stay in the Space tree. They are **not** children of the meta type database (unlike `record` nodes under `records` databases).

## Defaults

On workspace init, `ensurePageMetaTypes` creates:

1. Hidden space `Meta Types` (`description: __colanode_meta_types__`) — hidden from the Spaces sidebar
2. Default meta type database named `Page`
3. Backfills missing or invalid `metaTypeId` on existing pages

The default `Page` meta type cannot be deleted (`databaseModel.canDelete`).

## Queries

- `page.byMetaType` — SQL list via `nodes.meta_type_id` index
- Meta type views apply client-side filters/sorts in `applyCollectionViewQuery`
- Field value counts for Board/Table/List grouping use client-side `useFieldValueCounts`

## Supported views

Meta type databases support all standard database layouts:

| Layout | Notes |
|--------|-------|
| Table | Flat + grouped (select / multi-select) |
| Gallery | Page cards |
| List | Flat + grouped |
| Board | Select, multi-select, collaborator columns; drag to update page fields |
| Calendar | Date field grouping; day cell **+** pre-fills the date on new pages |

## UI entry points

- Settings → Meta Types — manage schemas
- Space → Create page — pick meta type
- Page header — Properties panel (`PageMetadata`)
- Meta type database — aggregated page list + Add page (with optional field prefill from view filters)
