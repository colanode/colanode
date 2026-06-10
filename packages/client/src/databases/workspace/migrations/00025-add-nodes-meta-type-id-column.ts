import { Migration, sql } from 'kysely';

export const addNodesMetaTypeIdColumn: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('nodes')
      .addColumn('meta_type_id', 'text', (col) =>
        col.generatedAlwaysAs(
          sql`json_extract(attributes, '$.metaTypeId')`
        ).stored()
      )
      .execute();

    await db.schema
      .createIndex('nodes_meta_type_id_type_index')
      .on('nodes')
      .columns(['meta_type_id', 'type'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropIndex('nodes_meta_type_id_type_index').execute();
    await db.schema.alterTable('nodes').dropColumn('meta_type_id').execute();
  },
};
