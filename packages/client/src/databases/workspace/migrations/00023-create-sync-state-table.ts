import { Migration } from 'kysely';

export const createSyncStateTable: Migration = {
    up: async (db) => {
        await db.schema
            .createTable('sync_state')
            .addColumn('key', 'text', (col) => col.notNull().primaryKey())
            .addColumn('value', 'text', (col) => col.notNull())
            .addColumn('created_at', 'text', (col) => col.notNull())
            .addColumn('updated_at', 'text')
            .execute();
    },
    down: async (db) => {
        await db.schema.dropTable('sync_state').execute();
    },
};
