import { Migration } from 'kysely';

export const createFileStatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('file_states')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('download_status', 'integer')
      .addColumn('download_progress', 'integer')
      .addColumn('download_retries', 'integer')
      .addColumn('download_started_at', 'text')
      .addColumn('download_completed_at', 'text')
      .addColumn('upload_status', 'integer')
      .addColumn('upload_progress', 'integer')
      .addColumn('upload_retries', 'integer')
      .addColumn('upload_started_at', 'text')
      .addColumn('upload_completed_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('file_states').execute();
  },
};
