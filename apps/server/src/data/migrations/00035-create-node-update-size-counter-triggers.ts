import { Migration, sql } from 'kysely';

export const createNodeUpdateSizeCounterTriggers: Migration = {
  up: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_node_update_size_counters ON node_updates;
      DROP FUNCTION IF EXISTS fn_update_node_update_size_counters();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.nodes.size')
      .execute();

    await sql`
      INSERT INTO counters (key, value, created_at, updated_at)
      SELECT
        CONCAT(workspace_id, '.nodes.size') AS key,
        COALESCE(SUM(octet_length(data)), 0) AS value,
        NOW(),
        NOW()
      FROM node_updates
      GROUP BY workspace_id;
    `.execute(db);

    await sql`
      INSERT INTO counters (key, value, created_at, updated_at)
      SELECT
        CONCAT(created_by, '.nodes.size') AS key,
        COALESCE(SUM(octet_length(data)), 0) AS value,
        NOW(),
        NOW()
      FROM node_updates
      GROUP BY created_by;
    `.execute(db);

    await sql`
      CREATE OR REPLACE FUNCTION fn_update_node_update_size_counters() RETURNS TRIGGER AS $$
      DECLARE
        workspace_key text;
        user_key text;
        old_workspace_key text;
        old_user_key text;
        new_size bigint := 0;
        old_size bigint := 0;
        size_difference bigint := 0;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          workspace_key := CONCAT(NEW.workspace_id, '.nodes.size');
          user_key := CONCAT(NEW.created_by, '.nodes.size');
          new_size := COALESCE(octet_length(NEW.data), 0);

          INSERT INTO counters (key, value, created_at, updated_at)
          VALUES
            (workspace_key, new_size, NOW(), NOW()),
            (user_key, new_size, NOW(), NOW())
          ON CONFLICT (key)
          DO UPDATE SET
            value = counters.value + EXCLUDED.value,
            updated_at = NOW();

          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          workspace_key := CONCAT(OLD.workspace_id, '.nodes.size');
          user_key := CONCAT(OLD.created_by, '.nodes.size');
          old_size := COALESCE(octet_length(OLD.data), 0);

          UPDATE counters
          SET value = GREATEST(0, value - CASE
                WHEN key = workspace_key THEN old_size
                WHEN key = user_key THEN old_size
              END),
              updated_at = NOW()
          WHERE key IN (workspace_key, user_key);

          RETURN OLD;
        ELSE
          workspace_key := CONCAT(NEW.workspace_id, '.nodes.size');
          user_key := CONCAT(NEW.created_by, '.nodes.size');
          old_workspace_key := CONCAT(OLD.workspace_id, '.nodes.size');
          old_user_key := CONCAT(OLD.created_by, '.nodes.size');
          new_size := COALESCE(octet_length(NEW.data), 0);
          old_size := COALESCE(octet_length(OLD.data), 0);
          size_difference := new_size - old_size;

          IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            UPDATE counters
            SET value = GREATEST(0, value - old_size), updated_at = NOW()
            WHERE key = old_workspace_key;

            INSERT INTO counters (key, value, created_at, updated_at)
            VALUES (workspace_key, new_size, NOW(), NOW())
            ON CONFLICT (key)
            DO UPDATE SET
              value = counters.value + EXCLUDED.value,
              updated_at = NOW();
          ELSIF size_difference <> 0 THEN
            UPDATE counters
            SET value = GREATEST(0, value + size_difference), updated_at = NOW()
            WHERE key = workspace_key;
          END IF;

          IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
            UPDATE counters
            SET value = GREATEST(0, value - old_size), updated_at = NOW()
            WHERE key = old_user_key;

            INSERT INTO counters (key, value, created_at, updated_at)
            VALUES (user_key, new_size, NOW(), NOW())
            ON CONFLICT (key)
            DO UPDATE SET
              value = counters.value + EXCLUDED.value,
              updated_at = NOW();
          ELSIF size_difference <> 0 THEN
            UPDATE counters
            SET value = GREATEST(0, value + size_difference), updated_at = NOW()
            WHERE key = user_key;
          END IF;

          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_node_update_size_counters ON node_updates;

      CREATE TRIGGER trg_node_update_size_counters
      AFTER INSERT OR UPDATE OR DELETE ON node_updates
      FOR EACH ROW
      EXECUTE FUNCTION fn_update_node_update_size_counters();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_node_update_size_counters ON node_updates;
      DROP FUNCTION IF EXISTS fn_update_node_update_size_counters();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.nodes.size')
      .execute();
  },
};
