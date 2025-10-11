import { Migration } from 'kysely';

export const createAvatarsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('avatars')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('path', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('opened_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('avatars').execute();
  },
};
