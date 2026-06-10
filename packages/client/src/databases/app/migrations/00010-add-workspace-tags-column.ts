import { Migration } from 'kysely';

export const addWorkspaceTagsColumn: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('workspaces')
      .addColumn('tags', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.alterTable('workspaces').dropColumn('tags').execute();
  },
};
