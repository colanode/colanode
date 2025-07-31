import { Migration } from 'kysely';

export const dropFileStatesTable: Migration = {
  up: async (db) => {
    await db.schema.dropTable('file_states').execute();
  },
  down: async () => {},
};
