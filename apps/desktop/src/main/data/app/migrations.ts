import { Migration } from 'kysely';

const createServersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('servers')
      .addColumn('domain', 'text', (col) => col.notNull().primaryKey())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('version', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('last_synced_at', 'text')
      .execute();

    await db
      .insertInto('servers')
      .values([
        {
          domain: 'eu.colanode.com',
          name: 'Colanode Cloud (EU)',
          avatar: '',
          attributes: '{}',
          version: '0.1.0',
          created_at: new Date().toISOString(),
        },
        {
          domain: 'us.colanode.com',
          name: 'Colanode Cloud (US)',
          avatar: '',
          attributes: '{}',
          version: '0.1.0',
          created_at: new Date().toISOString(),
        },
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('servers').execute();
  },
};

const createAccountsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('accounts')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('device_id', 'text', (col) => col.notNull())
      .addColumn('server', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('email', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text')
      .addColumn('token', 'text', (col) => col.notNull())
      .addColumn('status', 'text', (col) => col.defaultTo('active').notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('accounts').execute();
  },
};

const createWorkspacesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspaces')
      .addColumn('user_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'text', (col) => col.notNull())
      .addColumn('account_id', 'text', (col) =>
        col.notNull().references('accounts.id').onDelete('cascade')
      )
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('avatar', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('role', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspaces').execute();
  },
};

const createWorkspaceCursorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspace_cursors')
      .addColumn('user_id', 'text', (col) =>
        col
          .notNull()
          .primaryKey()
          .references('workspaces.user_id')
          .onDelete('cascade')
      )
      .addColumn('transactions', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('collaborations', 'integer', (col) =>
        col.notNull().defaultTo(0)
      )
      .addColumn('interactions', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('revocations', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspace_cursors').execute();
  },
};

const createDeletedTokensTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('deleted_tokens')
      .addColumn('account_id', 'text', (col) => col.notNull())
      .addColumn('token', 'text', (col) => col.notNull().primaryKey())
      .addColumn('server', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('deleted_tokens').execute();
  },
};

export const appDatabaseMigrations: Record<string, Migration> = {
  '00001_create_servers_table': createServersTable,
  '00002_create_accounts_table': createAccountsTable,
  '00003_create_workspaces_table': createWorkspacesTable,
  '00004_create_workspace_cursors_table': createWorkspaceCursorsTable,
  '00005_create_deleted_tokens_table': createDeletedTokensTable,
};
