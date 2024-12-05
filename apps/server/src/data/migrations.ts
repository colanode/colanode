import { Migration, sql } from 'kysely';

const createAccountsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('accounts')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('email', 'varchar(256)', (col) => col.notNull().unique())
      .addColumn('avatar', 'varchar(256)')
      .addColumn('password', 'varchar(256)')
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('status', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('accounts').execute();
  },
};

const createDevicesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('devices')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('token_hash', 'varchar(100)', (col) => col.notNull())
      .addColumn('token_salt', 'varchar(100)', (col) => col.notNull())
      .addColumn('token_generated_at', 'timestamptz', (col) => col.notNull())
      .addColumn('previous_token_hash', 'varchar(100)')
      .addColumn('previous_token_salt', 'varchar(100)')
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('version', 'varchar(30)', (col) => col.notNull())
      .addColumn('platform', 'varchar(30)')
      .addColumn('cpu', 'varchar(30)')
      .addColumn('hostname', 'varchar(30)')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('last_online_at', 'timestamptz')
      .addColumn('last_active_at', 'timestamptz')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('devices').execute();
  },
};

const createWorkspacesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspaces')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('description', 'varchar(256)')
      .addColumn('avatar', 'varchar(256)')
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspaces').execute();
  },
};

const createWorkspaceUsersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspace_users')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .addUniqueConstraint('unique_workspace_account_combination', [
        'workspace_id',
        'account_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspace_users').execute();
  },
};

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) =>
        col.generatedAlwaysAs(sql`(attributes->>'type')::VARCHAR(30)`).stored()
      )
      .addColumn('parent_id', 'varchar(30)', (col) =>
        col
          .generatedAlwaysAs(sql`(attributes->>'parentId')::VARCHAR(30)`)
          .stored()
          .notNull()
      )
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('attributes', 'jsonb', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('transaction_id', 'varchar(30)', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createTransactionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS transactions_version_seq
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('transactions')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('node_type', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('operation', 'varchar(30)', (col) => col.notNull())
      .addColumn('data', 'bytea')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('server_created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('transactions_version_seq')`)
      )
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('transactions').execute();
    await sql`DROP SEQUENCE IF EXISTS transactions_version_seq`.execute(db);
  },
};

const createNodePathsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_paths')
      .addColumn('ancestor_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('descendant_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('level', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_paths_pkey', [
        'ancestor_id',
        'descendant_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION fn_insert_node_path() RETURNS TRIGGER AS $$
      BEGIN
        -- Insert direct path from the new node to itself
        INSERT INTO node_paths (ancestor_id, descendant_id, workspace_id, level)
        VALUES (NEW.id, NEW.id, NEW.workspace_id, 0);

        -- Insert paths from ancestors to the new node
        INSERT INTO node_paths (ancestor_id, descendant_id, workspace_id, level)
        SELECT ancestor_id, NEW.id, NEW.workspace_id, level + 1
        FROM node_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_insert_node_path
      AFTER INSERT ON nodes
      FOR EACH ROW
      EXECUTE FUNCTION fn_insert_node_path();

      CREATE OR REPLACE FUNCTION fn_update_node_path() RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
          -- Delete old paths involving the updated node
          DELETE FROM node_paths
          WHERE descendant_id = NEW.id AND ancestor_id <> NEW.id;

          INSERT INTO node_paths (ancestor_id, descendant_id, workspace_id, level)
          SELECT ancestor_id, NEW.id, NEW.workspace_id, level + 1
          FROM node_paths
          WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_path
      AFTER UPDATE ON nodes
      EXECUTE FUNCTION fn_update_node_path();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_insert_node_path ON nodes;
      DROP TRIGGER IF EXISTS trg_update_node_path ON nodes;
      DROP FUNCTION IF EXISTS fn_insert_node_path();
      DROP FUNCTION IF EXISTS fn_update_node_path();
    `.execute(db);

    await db.schema.dropTable('node_paths').execute();
  },
};

const createCollaborationsTable: Migration = {
  up: async (db) => {
    // Create sequence first
    await sql`
      CREATE SEQUENCE IF NOT EXISTS collaborations_version_seq
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    // Create table with version column
    await db.schema
      .createTable('collaborations')
      .addColumn('user_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('roles', 'jsonb', (col) => col.notNull().defaultTo('{}'))
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('collaborations_version_seq')`)
      )
      .addPrimaryKeyConstraint('collaborations_pkey', ['user_id', 'node_id'])
      .execute();

    // Add trigger to update version on update
    await sql`
      CREATE OR REPLACE FUNCTION update_collaboration_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('collaborations_version_seq');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_collaboration_version
      BEFORE UPDATE ON collaborations
      FOR EACH ROW
      EXECUTE FUNCTION update_collaboration_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_collaboration_version ON collaborations;
      DROP FUNCTION IF EXISTS update_collaboration_version();
      DROP SEQUENCE IF EXISTS collaborations_version_seq;
    `.execute(db);
    await db.schema.dropTable('collaborations').execute();
  },
};

const createDeletedCollaborationsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS deleted_collaborations_version_seq
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('deleted_collaborations')
      .addColumn('user_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('version', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('deleted_collaborations_version_seq')`)
      )
      .addPrimaryKeyConstraint('deleted_collaborations_pkey', [
        'user_id',
        'node_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION handle_collaboration_update() RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.roles = '{}' THEN
          DELETE FROM collaborations WHERE user_id = NEW.user_id AND node_id = NEW.node_id;
          INSERT INTO deleted_collaborations (user_id, node_id, workspace_id, created_at)
          VALUES (NEW.user_id, NEW.node_id, NEW.workspace_id, NOW());
        ELSE
          DELETE FROM deleted_collaborations WHERE user_id = NEW.user_id AND node_id = NEW.node_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER after_collaboration_insert
      AFTER INSERT ON collaborations
      FOR EACH ROW EXECUTE FUNCTION handle_collaboration_update();

      CREATE TRIGGER after_collaboration_update
      AFTER UPDATE ON collaborations
      FOR EACH ROW EXECUTE FUNCTION handle_collaboration_update();
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('deleted_collaborations').execute();
  },
};

const createUploadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('uploads')
      .addColumn('node_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('no action').primaryKey()
      )
      .addColumn('upload_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('path', 'varchar(256)', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('mime_type', 'varchar(256)', (col) => col.notNull())
      .addColumn('type', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('completed_at', 'timestamptz', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('uploads').execute();
  },
};

const createInteractionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS interactions_version_seq
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('interactions')
      .addColumn('user_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('node_type', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('attributes', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('server_created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('server_updated_at', 'timestamptz')
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('interactions_version_seq')`)
      )
      .addPrimaryKeyConstraint('interactions_pkey', ['user_id', 'node_id'])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_interaction_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('interactions_version_seq');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_interaction_version
      BEFORE UPDATE ON interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_interaction_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_interaction_version ON interactions;
      DROP FUNCTION IF EXISTS update_interaction_version();
      DROP SEQUENCE IF EXISTS interactions_version_seq;
    `.execute(db);

    await db.schema.dropTable('interactions').execute();
  },
};

export const databaseMigrations: Record<string, Migration> = {
  '00001_create_accounts_table': createAccountsTable,
  '00002_create_devices_table': createDevicesTable,
  '00003_create_workspaces_table': createWorkspacesTable,
  '00004_create_workspace_users_table': createWorkspaceUsersTable,
  '00005_create_nodes_table': createNodesTable,
  '00006_create_transactions_table': createTransactionsTable,
  '00007_create_node_paths_table': createNodePathsTable,
  '00008_create_collaborations_table': createCollaborationsTable,
  '00009_create_deleted_collaborations_table': createDeletedCollaborationsTable,
  '00010_create_uploads_table': createUploadsTable,
  '00011_create_interactions_table': createInteractionsTable,
};
