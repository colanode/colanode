import { Migration } from 'kysely';

export const dropDeletedTokensTable: Migration = {
  up: async (db) => {
    await db.schema.dropTable('deleted_tokens').execute();
  },
  down: async () => {
    // noop
  },
};
