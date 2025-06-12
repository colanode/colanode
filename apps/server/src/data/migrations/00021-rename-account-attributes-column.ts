import { Migration } from 'kysely';

// This migration is being done for the sake of consistency. We use the full name 'attributes' in other tables,
export const renameAccountAttributesColumn: Migration = {
  up: async (db) => {
    await db.schema
      .alterTable('accounts')
      .renameColumn('attrs', 'attributes')
      .execute();
  },
  down: async (db) => {
    await db.schema
      .alterTable('accounts')
      .renameColumn('attributes', 'attrs')
      .execute();
  },
};
