import { Migration } from 'kysely';

export const createDocumentStatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('document_states')
      .addColumn('id', 'text', (col) =>
        col
          .notNull()
          .primaryKey()
          .references('documents.id')
          .onDelete('cascade')
      )
      .addColumn('state', 'blob', (col) => col.notNull())
      .addColumn('revision', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('document_states').execute();
  },
};
