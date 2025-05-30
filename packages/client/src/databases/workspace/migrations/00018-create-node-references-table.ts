import { Migration } from 'kysely';

export const createNodeReferencesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_references')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('reference_id', 'text', (col) => col.notNull())
      .addColumn('inner_id', 'text', (col) => col.notNull())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_references_pkey', [
        'node_id',
        'reference_id',
        'inner_id',
      ])
      .execute();

    await db.schema
      .createIndex('node_references_reference_id_idx')
      .on('node_references')
      .column('reference_id')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_references').execute();
  },
};
