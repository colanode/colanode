import { Migration } from 'kysely';

export const createNodeReactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_reactions')
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('reaction', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('revision', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_reactions_pkey', [
        'node_id',
        'collaborator_id',
        'reaction',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_reactions').execute();
  },
};
