import { Migration } from 'kysely';

export const createNodeInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_interactions')
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('revision', 'integer', (col) => col.notNull())
      .addColumn('first_seen_at', 'text')
      .addColumn('last_seen_at', 'text')
      .addColumn('first_opened_at', 'text')
      .addColumn('last_opened_at', 'text')
      .addPrimaryKeyConstraint('node_interactions_pkey', [
        'node_id',
        'collaborator_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_interactions').execute();
  },
};
