import { Migration, sql } from 'kysely';

export const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'text', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored()
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
      )
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('local_revision', 'integer', (col) => col.notNull())
      .addColumn('server_revision', 'integer', (col) => col.notNull())
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .execute();

    await db.schema
      .createIndex('nodes_parent_id_type_index')
      .on('nodes')
      .columns(['parent_id', 'type'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};
