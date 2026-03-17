import { Migration } from 'kysely';

export const addDefaultToDownloadsType: Migration = {
  up: async (db) => {
    try {
      await db.schema
        .alterTable('downloads')
        .alterColumn('type', (col) => col.setDefault(0))
        .execute();
    } catch (err) {
      // Ignore if the database dialect doesn't support alter column
    }
  },
  down: async (db) => {
    try {
      await db.schema
        .alterTable('downloads')
        .alterColumn('type', (col) => col.dropDefault())
        .execute();
    } catch (err) {
      // Ignore
    }
  },
};
