import { Migration } from 'kysely';

import { ensureNodesMetaTypeIdColumn } from './meta-type-id-column';

export const addNodesMetaTypeIdColumn: Migration = {
  up: async (db) => {
    await ensureNodesMetaTypeIdColumn(db);
  },
  down: async (db) => {
    await db.schema.dropIndex('nodes_meta_type_id_type_index').execute();
    await db.schema.alterTable('nodes').dropColumn('meta_type_id').execute();
  },
};
