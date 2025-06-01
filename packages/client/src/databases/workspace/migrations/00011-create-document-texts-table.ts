import { Migration, sql } from 'kysely';

export const createDocumentTextsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE document_texts USING fts5(id UNINDEXED, text, content='', contentless_delete=1);
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE IF EXISTS document_texts;
    `.execute(db);
  },
};
