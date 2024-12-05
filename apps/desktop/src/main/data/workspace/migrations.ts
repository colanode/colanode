import { Migration, sql } from 'kysely';

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'text', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored()
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
          .notNull()
      )
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('transaction_id', 'text', (col) => col.notNull())
      .execute();

    await sql`
      CREATE INDEX IF NOT EXISTS "nodes_parent_id_type_index" ON "nodes" ("parent_id", "type");
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createTransactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('transactions')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('node_type', 'text', (col) => col.notNull())
      .addColumn('operation', 'text', (col) => col.notNull())
      .addColumn('data', 'blob')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .addColumn('status', 'text', (col) => col.defaultTo('pending'))
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('transactions').execute();
  },
};

const createCollaborationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('collaborations')
      .addColumn('user_id', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('workspace_id', 'text', (col) => col.notNull())
      .addColumn('roles', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('version', 'integer')
      .addPrimaryKeyConstraint('collaborations_pkey', ['user_id', 'node_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('collaborations').execute();
  },
};

const createDownloadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('downloads')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().primaryKey().references('nodes.id').onDelete('cascade')
      )
      .addColumn('upload_id', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('completed_at', 'text')
      .addColumn('progress', 'integer', (col) => col.defaultTo(0))
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('downloads').execute();
  },
};

const createUploadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('uploads')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().primaryKey().references('nodes.id').onDelete('cascade')
      )
      .addColumn('upload_id', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('progress', 'integer', (col) => col.defaultTo(0))
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('uploads').execute();
  },
};

const createInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('interactions')
      .addColumn('user_id', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('node_type', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text')
      .addColumn('last_seen_at', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.lastSeenAt')`)
          .stored()
      )
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('interactions_pkey', ['user_id', 'node_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('interactions').execute();
  },
};

const createInteractionEventsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('interaction_events')
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('node_type', 'text', (col) => col.notNull())
      .addColumn('attribute', 'text', (col) => col.notNull())
      .addColumn('value', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('sent_at', 'text')
      .addColumn('event_id', 'text', (col) => col.notNull())
      .addPrimaryKeyConstraint('interaction_events_pkey', [
        'node_id',
        'attribute',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('interaction_events').execute();
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
      .addColumn('level', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_paths_pkey', [
        'ancestor_id',
        'descendant_id',
      ])
      .execute();

    await sql`
      CREATE TRIGGER trg_insert_node_path
      AFTER INSERT ON nodes
      FOR EACH ROW
      BEGIN
        -- Insert direct path from the new node to itself
        INSERT INTO node_paths (ancestor_id, descendant_id, level)
        VALUES (NEW.id, NEW.id, 0);

        -- Insert paths from ancestors to the new node
        INSERT INTO node_paths (ancestor_id, descendant_id, level)
        SELECT ancestor_id, NEW.id, level + 1
        FROM node_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
      END;
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_update_node_path
      AFTER UPDATE ON nodes
      FOR EACH ROW
      WHEN OLD.parent_id <> NEW.parent_id
      BEGIN
        -- Delete old paths involving the updated node
        DELETE FROM node_paths
        WHERE descendant_id = NEW.id AND ancestor_id <> NEW.id;

        -- Insert new paths from ancestors to the updated node
        INSERT INTO node_paths (ancestor_id, descendant_id, level)
        SELECT ancestor_id, NEW.id, level + 1
        FROM node_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_insert_node_path;
      DROP TRIGGER IF EXISTS trg_update_node_path;
    `.execute(db);

    await db.schema.dropTable('node_paths').execute();
  },
};

const createNodeNamesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE node_names USING fts5(id UNINDEXED, name);
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE IF EXISTS node_names;
    `.execute(db);
  },
};

const createNodeInsertNameTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_insert_name
      AFTER INSERT ON nodes
      WHEN json_type(NEW.attributes, '$.name') = 'text'
      BEGIN
        INSERT INTO node_names (id, name)
        VALUES (
          NEW.id,
          json_extract(NEW.attributes, '$.name')
        );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER node_insert_name;
    `.execute(db);
  },
};

const createNodeUpdateNameTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_update_name
      AFTER UPDATE ON nodes
      WHEN json_extract(OLD.attributes, '$.name') IS NOT json_extract(NEW.attributes, '$.name')
      BEGIN
        DELETE FROM node_names WHERE id = OLD.id;

        INSERT INTO node_names (id, name)
        SELECT
          NEW.id,
          json_extract(NEW.attributes, '$.name')
        WHERE json_type(NEW.attributes, '$.name') = 'text';
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER node_update_name;
    `.execute(db);
  },
};

const createNodeDeleteNameTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_delete_name
      AFTER DELETE ON nodes
      BEGIN
        DELETE FROM node_names WHERE id = OLD.id;
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER node_delete_name;
    `.execute(db);
  },
};

const createCursorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('cursors')
      .addColumn('type', 'text', (col) => col.notNull().primaryKey())
      .addColumn('value', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('cursors').execute();
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_nodes_table': createNodesTable,
  '00002_create_transactions_table': createTransactionsTable,
  '00003_create_collaborations_table': createCollaborationsTable,
  '00004_create_uploads_table': createUploadsTable,
  '00005_create_downloads_table': createDownloadsTable,
  '00006_create_interactions_table': createInteractionsTable,
  '00007_create_interaction_events_table': createInteractionEventsTable,
  '00008_create_node_paths_table': createNodePathsTable,
  '00009_create_node_names_table': createNodeNamesTable,
  '00010_create_node_insert_name_trigger': createNodeInsertNameTrigger,
  '00011_create_node_update_name_trigger': createNodeUpdateNameTrigger,
  '00012_create_node_delete_name_trigger': createNodeDeleteNameTrigger,
  '00013_create_cursors_table': createCursorsTable,
};
