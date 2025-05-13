import { Migration } from 'kysely';

export const createNodeUpdatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_updates')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('data', 'blob', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_updates').execute();
  },
};
