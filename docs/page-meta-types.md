# Page Meta Types

Workspace-level page property schemas backed by `database` nodes with `purpose: 'meta_type'`.

## Model

- **Schema**: `database` node with `purpose: 'meta_type'` and `fields` (same as record databases).
- **Instance**: `page` node with `metaTypeId` + optional `fields` (`fieldValueSchema`).
- **Collection**: meta type database views query pages via `page.byMetaType` (`nodes.meta_type_id` index).

## Defaults

On workspace init, `ensurePageMetaTypes` creates:

1. Hidden space `Meta Types` (`description: __colanode_meta_types__`)
2. Default meta type database named `Page`
3. Backfills `metaTypeId` on existing pages

## UI

- Settings → Meta Types: manage schemas
- Page create: pick meta type
- Page header: Properties panel (`PageMetadata`)
- Meta type database views: table/gallery over matching pages

## Queries

- `page.byMetaType` — list pages for a meta type database id
