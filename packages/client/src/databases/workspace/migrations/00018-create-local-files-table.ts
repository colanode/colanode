import { Migration } from 'kysely';

export const createLocalFilesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('local_files')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('path', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('opened_at', 'text', (col) => col.notNull())
      .addColumn('download_status', 'integer', (col) => col.notNull())
      .addColumn('download_progress', 'integer', (col) => col.notNull())
      .addColumn('download_retries', 'integer', (col) => col.notNull())
      .addColumn('download_completed_at', 'text')
      .addColumn('download_error_code', 'text')
      .addColumn('download_error_message', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('local_files').execute();
  },
};
