import { Migration } from 'kysely';

export const createFilesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('files')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('path', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('mime_type', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('files').execute();
  },
};
