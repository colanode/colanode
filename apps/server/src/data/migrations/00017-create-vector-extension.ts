import { Migration, sql } from 'kysely';

export const createVectorExtension: Migration = {
  up: async (db) => {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`.execute(db);
  },
  down: async (db) => {
    await sql`DROP EXTENSION IF EXISTS vector`.execute(db);
  },
};
