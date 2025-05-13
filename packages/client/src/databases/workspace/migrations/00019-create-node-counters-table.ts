import { Migration } from 'kysely';

export const createNodeCountersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_counters')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('count', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addPrimaryKeyConstraint('node_counters_pkey', ['node_id', 'type'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_counters').execute();
  },
};
