import { Migration } from 'kysely';

export const createDocumentUpdatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('document_updates')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('document_id', 'text', (col) =>
        col.notNull().references('documents.id').onDelete('cascade')
      )
      .addColumn('data', 'blob', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('document_updates').execute();
  },
};
