import { Migration } from 'kysely';

export const createCursorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('cursors')
      .addColumn('key', 'text', (col) => col.notNull().primaryKey())
      .addColumn('value', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('cursors').execute();
  },
};
