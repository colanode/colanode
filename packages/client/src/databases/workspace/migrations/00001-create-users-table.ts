import { Migration } from 'kysely';

export const createUsersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('users')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('revision', 'integer', (col) => col.notNull())
      .addColumn('email', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text')
      .addColumn('custom_name', 'text')
      .addColumn('custom_avatar', 'text')
      .addColumn('role', 'text', (col) => col.notNull())
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('users').execute();
  },
};
