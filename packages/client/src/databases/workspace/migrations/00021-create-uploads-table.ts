import { Migration } from 'kysely';

export const createUploadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('uploads')
      .addColumn('file_id', 'text', (col) => col.notNull().primaryKey())
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
    await db.schema.dropTable('uploads').execute();
  },
};
