import { Migration } from 'kysely';

export const addWorkspaceStorageLimitColumns: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('workspaces')
      .addColumn('storage_limit', 'bigint')
      .addColumn('max_file_size', 'bigint')
      .execute();
  },
  down: async (db) => {
    await db.schema
      .alterTable('workspaces')
      .dropColumn('storage_limit')
      .dropColumn('max_file_size')
      .execute();
  },
};
