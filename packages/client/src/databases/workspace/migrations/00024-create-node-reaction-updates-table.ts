import { Migration } from 'kysely';

export const createNodeReactionUpdatesTable: Migration = {
    up: async (db) => {
        await db.schema
            .createTable('node_reaction_updates')
            .addColumn('id', 'text', (col) => col.notNull().primaryKey())
            .addColumn('node_id', 'text', (col) => col.notNull())
            .addColumn('collaborator_id', 'text', (col) => col.notNull())
            .addColumn('reaction', 'text', (col) => col.notNull())
            .addColumn('root_id', 'text', (col) => col.notNull())
            .addColumn('data', 'text', (col) => col.notNull())
            .addColumn('created_at', 'text', (col) => col.notNull())
            .execute();
    },
    down: async (db) => {
        await db.schema.dropTable('node_reaction_updates').execute();
    },
};
