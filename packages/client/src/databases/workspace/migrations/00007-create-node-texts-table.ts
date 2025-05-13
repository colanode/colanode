import { Migration, sql } from 'kysely';

export const createNodeTextsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE node_texts USING fts5(id UNINDEXED, name, attributes, content='', contentless_delete=1);
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE IF EXISTS node_texts;
    `.execute(db);
  },
};
