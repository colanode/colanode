import { Migration } from 'kysely';

export const createCountersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('counters')
      .addColumn('key', 'varchar(500)', (col) => col.notNull().primaryKey())
      .addColumn('value', 'bigint', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('counters').execute();
  },
};
