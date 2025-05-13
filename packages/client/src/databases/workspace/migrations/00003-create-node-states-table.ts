import { Migration } from 'kysely';

export const createNodeStatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_states')
      .addColumn('id', 'text', (col) =>
        col.notNull().primaryKey().references('nodes.id').onDelete('cascade')
      )
      .addColumn('state', 'blob', (col) => col.notNull())
      .addColumn('revision', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_states').execute();
  },
};
