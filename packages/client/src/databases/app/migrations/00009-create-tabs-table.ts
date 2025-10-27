import { Migration } from 'kysely';

export const createTabsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('tabs')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('location', 'text', (col) => col.notNull())
      .addColumn('index', 'text', (col) => col.notNull())
      .addColumn('last_active_at', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('tabs').execute();
  },
};
