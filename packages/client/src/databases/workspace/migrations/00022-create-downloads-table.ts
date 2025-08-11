import { Migration } from 'kysely';

export const createDownloadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('downloads')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('file_id', 'text', (col) => col.notNull())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('path', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('mime_type', 'text', (col) => col.notNull())
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('progress', 'integer', (col) => col.notNull())
      .addColumn('retries', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('started_at', 'text')
      .addColumn('completed_at', 'text')
      .addColumn('error_code', 'text')
      .addColumn('error_message', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('downloads').execute();
  },
};
