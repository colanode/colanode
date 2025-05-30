import { Migration } from 'kysely';

export const createMetadataTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('metadata')
      .addColumn('key', 'text', (col) => col.notNull().primaryKey())
      .addColumn('value', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('metadata').execute();
  },
};
