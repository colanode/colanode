import { Migration } from 'kysely';

export const createLocalFilesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('local_files')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('path', 'text', (col) => col.notNull())
      .addColumn('extension', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('subtype', 'text', (col) => col.notNull())
      .addColumn('mime_type', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('opened_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('local_files').execute();
  },
};
