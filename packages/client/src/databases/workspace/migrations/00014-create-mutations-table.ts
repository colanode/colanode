import { Migration } from 'kysely';

export const createMutationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('mutations')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('data', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('retries', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('mutations').execute();
  },
};
