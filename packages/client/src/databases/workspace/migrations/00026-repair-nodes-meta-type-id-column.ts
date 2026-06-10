import { Migration } from 'kysely';

import { ensureNodesMetaTypeIdColumn } from './meta-type-id-column';

// Repair workspaces where 00025 was recorded but the STORED column DDL failed.
export const repairNodesMetaTypeIdColumn: Migration = {
  up: async (db) => {
    await ensureNodesMetaTypeIdColumn(db);
  },
  down: async () => {
    // No-op: 00025 down handles removal when rolling back past 00025.
  },
};
