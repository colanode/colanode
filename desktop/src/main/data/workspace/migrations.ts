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
          .stored(),
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
          .references('nodes.id')
          .onDelete('cascade'),
      )
      .addColumn('index', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.index')`)
          .stored(),
      )
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('state', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('server_version_id', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createNodesParentIdAndTypeIndex: Migration = {
  up: async (db) => {
    await sql`
      CREATE INDEX IF NOT EXISTS "nodes_parent_id_type_index" ON "nodes" ("parent_id", "type");
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP INDEX IF EXISTS "nodes_parent_id_type_index"`.execute(db);
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
      DROP TABLE node_names;
    `.execute(db);
  },
};

const createNodeCollaboratorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_collaborators')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('collaborator_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('role', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('version_id', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('server_updated_at', 'text')
      .addColumn('server_version_id', 'text')
      .addPrimaryKeyConstraint('node_reactions_pkey', [
        'node_id',
        'collaborator_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_collaborators').execute();
  },
};

const createNodeReactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_reactions')
      .addColumn('node_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('actor_id', 'text', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('reaction', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addPrimaryKeyConstraint('node_reactions_pkey', [
        'node_id',
        'actor_id',
        'reaction',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_reactions').execute();
  },
};

const createChangesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('changes')
      .addColumn('id', 'integer', (col) => col.notNull().primaryKey())
      .addColumn('table', 'text', (col) => col.notNull())
      .addColumn('action', 'text', (col) => col.notNull())
      .addColumn('before', 'text')
      .addColumn('after', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('retry_count', 'integer', (col) => col.defaultTo(0))
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('changes').execute();
  },
};

const createNodeInsertChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_insert_change
      AFTER INSERT ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL
      BEGIN
          INSERT INTO changes ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'nodes',
              json_object(
                  'id', NEW.'id',
                  'type', NEW.'type',
                  'parent_id', NEW.'parent_id',
                  'index', NEW.'index',
                  'attributes', NEW.'attributes',
                  'state', NEW.'state',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_insert_change`.execute(db);
  },
};

const createNodeUpdateChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_update_change
      AFTER UPDATE ON nodes
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL OR NEW.version_id != NEW.server_version_id
      BEGIN
          INSERT INTO changes ('action', 'table', 'before', 'after', 'created_at')
          VALUES (
              'update',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'type', OLD.'type',
                  'parent_id', OLD.'parent_id',
                  'index', OLD.'index',
                  'attributes', OLD.'attributes',
                  'state', OLD.'state',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              json_object(
                  'id', NEW.'id',
                  'type', NEW.'type',
                  'parent_id', NEW.'parent_id',
                  'index', NEW.'index',
                  'attributes', NEW.'attributes',
                  'state', NEW.'state',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_update_change`.execute(db);
  },
};

const createNodeDeleteChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_delete_change
      AFTER DELETE ON nodes
      FOR EACH ROW
      BEGIN
          INSERT INTO changes ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'nodes',
              json_object(
                  'id', OLD.'id',
                  'type', OLD.'type',
                  'parent_id', OLD.'parent_id',
                  'index', OLD.'index',
                  'attributes', OLD.'attributes',
                  'state', OLD.'state',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_delete_change`.execute(db);
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

const createNodeCollaboratorInsertChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_collaborator_insert_change
      AFTER INSERT ON node_collaborators
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL
      BEGIN
          INSERT INTO changes ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'node_collaborators',
              json_object(
                  'node_id', NEW.'node_id',
                  'collaborator_id', NEW.'collaborator_id',
                  'role', NEW.'role',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_collaborator_insert_change`.execute(db);
  },
};

const createNodeCollaboratorUpdateChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_collaborator_update_change
      AFTER UPDATE ON node_collaborators
      FOR EACH ROW
      WHEN NEW.server_version_id IS NULL OR NEW.version_id != NEW.server_version_id
      BEGIN
          INSERT INTO changes ('action', 'table', 'before', 'after', 'created_at')
          VALUES (
              'update',
              'node_collaborators',
              json_object(
                  'node_id', OLD.'node_id',
                  'collaborator_id', OLD.'collaborator_id',
                  'role', OLD.'role',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              json_object(
                  'node_id', NEW.'node_id',
                  'collaborator_id', NEW.'collaborator_id',
                  'role', NEW.'role',
                  'created_at', NEW.'created_at',
                  'updated_at', NEW.'updated_at',
                  'created_by', NEW.'created_by',
                  'updated_by', NEW.'updated_by',
                  'version_id', NEW.'version_id',
                  'server_created_at', NEW.'server_created_at',
                  'server_updated_at', NEW.'server_updated_at',
                  'server_version_id', NEW.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_collaborator_update_change`.execute(db);
  },
};

const createNodeCollaboratorDeleteChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_collaborator_delete_change
      AFTER DELETE ON node_collaborators
      FOR EACH ROW
      BEGIN
          INSERT INTO changes ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'node_collaborators',
              json_object(
                  'node_id', OLD.'node_id',
                  'collaborator_id', OLD.'collaborator_id',
                  'role', OLD.'role',
                  'created_at', OLD.'created_at',
                  'updated_at', OLD.'updated_at',
                  'created_by', OLD.'created_by',
                  'updated_by', OLD.'updated_by',
                  'version_id', OLD.'version_id',
                  'server_created_at', OLD.'server_created_at',
                  'server_updated_at', OLD.'server_updated_at',
                  'server_version_id', OLD.'server_version_id'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_collaborator_delete_change`.execute(db);
  },
};

const createNodeReactionInsertChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_reaction_insert_change
      AFTER INSERT ON node_reactions
      FOR EACH ROW
      WHEN NEW.server_created_at IS NULL
      BEGIN
          INSERT INTO changes ('action', 'table', 'after', 'created_at')
          VALUES (
              'insert',
              'node_reactions',
              json_object(
                  'node_id', NEW.'node_id',
                  'actor_id', NEW.'actor_id',
                  'reaction', NEW.'reaction',
                  'created_at', NEW.'created_at',
                  'server_created_at', NEW.'server_created_at'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER after_insert_node_reactions`.execute(db);
  },
};

const createNodeReactionDeleteChangeTrigger: Migration = {
  up: async (db) => {
    await sql`
      CREATE TRIGGER node_reaction_delete_change
      AFTER DELETE ON node_reactions
      FOR EACH ROW
      BEGIN
          INSERT INTO changes ('action', 'table', 'before', 'created_at')
          VALUES (
              'delete',
              'node_reactions',
              json_object(
                  'node_id', OLD.'node_id',
                  'actor_id', OLD.'actor_id',
                  'reaction', OLD.'reaction',
                  'created_at', OLD.'created_at',
                  'server_created_at', OLD.'server_created_at'
              ),
              datetime('now')
          );
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`DROP TRIGGER node_reaction_delete_change`.execute(db);
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_nodes_table': createNodesTable,
  '00002_create_nodes_parent_id_and_type_index':
    createNodesParentIdAndTypeIndex,
  '00003_create_node_reactions_table': createNodeReactionsTable,
  '00004_create_node_names_table': createNodeNamesTable,
  '00005_create_node_collaborators_table': createNodeCollaboratorsTable,
  '00006_create_changes_table': createChangesTable,
  '00007_create_node_insert_change_trigger': createNodeInsertChangeTrigger,
  '00008_create_node_update_change_trigger': createNodeUpdateChangeTrigger,
  '00009_create_node_delete_change_trigger': createNodeDeleteChangeTrigger,
  '00010_create_node_insert_name_trigger': createNodeInsertNameTrigger,
  '00011_create_node_update_name_trigger': createNodeUpdateNameTrigger,
  '00012_create_node_delete_name_trigger': createNodeDeleteNameTrigger,
  '00013_create_node_collaborator_insert_change_trigger':
    createNodeCollaboratorInsertChangeTrigger,
  '00014_create_node_collaborator_update_change_trigger':
    createNodeCollaboratorUpdateChangeTrigger,
  '00015_create_node_collaborator_delete_change_trigger':
    createNodeCollaboratorDeleteChangeTrigger,
  '00016_create_node_reaction_insert_change_trigger':
    createNodeReactionInsertChangeTrigger,
  '00017_create_node_reaction_delete_change_trigger':
    createNodeReactionDeleteChangeTrigger,
};