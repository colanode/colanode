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

    await db
      .insertInto('servers')
      .values([
        {
          domain: 'eu.colanode.com',
          name: 'Colanode Cloud (EU)',
          avatar: 'https://colanode.com/assets/flags/eu.svg',
          attributes: '{}',
          version: '0.1.0',
          created_at: new Date().toISOString(),
        },
        {
          domain: 'us.colanode.com',
          name: 'Colanode Cloud (US)',
          avatar: 'https://colanode.com/assets/flags/us.svg',
          attributes: '{}',
          version: '0.1.0',
          created_at: new Date().toISOString(),
        },
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('servers').execute();
  },
};
