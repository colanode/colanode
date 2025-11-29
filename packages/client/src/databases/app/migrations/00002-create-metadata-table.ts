import { Migration } from 'kysely';

export const createMetadataTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('metadata')
      .addColumn('namespace', 'text', (col) => col.notNull())
      .addColumn('key', 'text', (col) => col.notNull())
      .addColumn('value', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addPrimaryKeyConstraint('pk_metadata', ['namespace', 'key'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('metadata').execute();
  },
};
