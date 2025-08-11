import { Migration, sql } from 'kysely';

export const addCreatedAtIndexToUploads: Migration = {
  up: async (db) => {
    await sql`CREATE INDEX uploads_created_at_idx ON uploads (created_at) WHERE uploaded_at IS NULL`.execute(
      db
    );
  },
  down: async (db) => {
    await sql`DROP INDEX IF EXISTS uploads_created_at_idx`.execute(db);
  },
};
