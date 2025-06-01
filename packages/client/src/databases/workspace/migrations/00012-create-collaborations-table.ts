import { Migration } from 'kysely';

export const createCollaborationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('collaborations')
      .addColumn('node_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('role', 'text')
      .addColumn('revision', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('deleted_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('collaborations').execute();
  },
};
