import { Migration, sql } from 'kysely';

export const cleanupCounterTriggers: Migration = {
  up: async (db) => {
    // Drop triggers and functions from 00026-create-user-upload-counter-triggers.ts
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_user_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_decrement_user_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_update_user_storage_counter ON uploads;
      DROP FUNCTION IF EXISTS fn_increment_user_storage_counter();
      DROP FUNCTION IF EXISTS fn_decrement_user_storage_counter();
      DROP FUNCTION IF EXISTS fn_update_user_storage_counter();
    `.execute(db);

    // Drop triggers and functions from 00025-create-workspace-upload-counter-triggers.ts
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_workspace_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_decrement_workspace_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_update_workspace_storage_counter ON uploads;
      DROP FUNCTION IF EXISTS fn_increment_workspace_storage_counter();
      DROP FUNCTION IF EXISTS fn_decrement_workspace_storage_counter();
      DROP FUNCTION IF EXISTS fn_update_workspace_storage_counter();
    `.execute(db);

    // Drop triggers and functions from 00024-create-workspace-node-counter-triggers.ts
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_workspace_node_counter ON nodes;
      DROP TRIGGER IF EXISTS trg_decrement_workspace_node_counter ON nodes;
      DROP FUNCTION IF EXISTS fn_increment_workspace_node_counter();
      DROP FUNCTION IF EXISTS fn_decrement_workspace_node_counter();
    `.execute(db);

    // Drop triggers and functions from 00023-create-workspace-user-counter-triggers.ts
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_workspace_user_counter ON users;
      DROP TRIGGER IF EXISTS trg_decrement_workspace_user_counter ON users;
      DROP FUNCTION IF EXISTS fn_increment_workspace_user_counter();
      DROP FUNCTION IF EXISTS fn_decrement_workspace_user_counter();
    `.execute(db);

    // Drop counters
    await db.deleteFrom('counters').execute();
  },
  down: async () => {
    // This migration is destructive (drops triggers). There is no down migration.
  },
};
