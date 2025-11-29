import { Migration } from 'kysely';

export const createServersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('servers')
      .addColumn('domain', 'text', (col) => col.notNull().primaryKey())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('synced_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('servers').execute();
  },
};
