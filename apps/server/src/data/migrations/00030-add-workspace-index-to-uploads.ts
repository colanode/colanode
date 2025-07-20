import { Migration } from 'kysely';

export const addWorkspaceIndexToUploads: Migration = {
  up: async (db) => {
    await db.schema
      .createIndex('uploads_workspace_id_idx')
      .on('uploads')
      .columns(['workspace_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema
      .dropIndex('uploads_workspace_id_idx')
      .on('uploads')
      .execute();
  },
};
