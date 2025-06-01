import { Migration } from 'kysely';

export const createDeletedTokensTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('deleted_tokens')
      .addColumn('account_id', 'text', (col) => col.notNull())
      .addColumn('token', 'text', (col) => col.notNull().primaryKey())
      .addColumn('server', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('deleted_tokens').execute();
  },
};
