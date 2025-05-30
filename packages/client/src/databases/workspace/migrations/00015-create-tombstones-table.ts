import { Migration } from 'kysely';

export const createTombstonesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('tombstones')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('data', 'text', (col) => col.notNull())
      .addColumn('deleted_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('tombstones').execute();
  },
};
