import { Migration, sql } from 'kysely';

export const createNodeCounterTriggers: Migration = {
  up: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_workspace_node_counter ON nodes;
      DROP TRIGGER IF EXISTS trg_decrement_workspace_node_counter ON nodes;
      DROP FUNCTION IF EXISTS fn_increment_workspace_node_counter();
      DROP FUNCTION IF EXISTS fn_decrement_workspace_node_counter();
      DROP TRIGGER IF EXISTS trg_increment_user_node_counter ON nodes;
      DROP TRIGGER IF EXISTS trg_decrement_user_node_counter ON nodes;
      DROP FUNCTION IF EXISTS fn_increment_user_node_counter();
      DROP FUNCTION IF EXISTS fn_decrement_user_node_counter();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.nodes.count')
      .execute();

    const now = new Date();

    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at', 'updated_at'])
      .expression((eb) =>
        eb
          .selectFrom('nodes')
          .select([
            eb
              .fn('concat', [
                eb.ref('workspace_id'),
                eb.cast(eb.val('.nodes.count'), 'varchar'),
              ])
              .as('key'),
            eb.fn.count('id').as('value'),
            eb.val(now).as('created_at'),
            eb.val(now).as('updated_at'),
          ])
          .groupBy('workspace_id')
      )
      .execute();

    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at', 'updated_at'])
      .expression((eb) =>
        eb
          .selectFrom('nodes')
          .select([
            eb
              .fn('concat', [
                eb.ref('created_by'),
                eb.cast(eb.val('.nodes.count'), 'varchar'),
              ])
              .as('key'),
            eb.fn.count('id').as('value'),
            eb.val(now).as('created_at'),
            eb.val(now).as('updated_at'),
          ])
          .groupBy('created_by')
      )
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION fn_update_node_counters() RETURNS TRIGGER AS $$
      DECLARE
        workspace_key text;
        user_key text;
        old_workspace_key text;
        old_user_key text;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          workspace_key := CONCAT(NEW.workspace_id, '.nodes.count');
          user_key := CONCAT(NEW.created_by, '.nodes.count');

          INSERT INTO counters (key, value, created_at, updated_at)
          VALUES
            (workspace_key, 1, NOW(), NOW()),
            (user_key, 1, NOW(), NOW())
          ON CONFLICT (key)
          DO UPDATE SET
            value = counters.value + 1,
            updated_at = NOW();

          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          workspace_key := CONCAT(OLD.workspace_id, '.nodes.count');
          user_key := CONCAT(OLD.created_by, '.nodes.count');

          UPDATE counters
          SET value = GREATEST(0, value - 1), updated_at = NOW()
          WHERE key IN (workspace_key, user_key);

          RETURN OLD;
        ELSE
          workspace_key := CONCAT(NEW.workspace_id, '.nodes.count');
          user_key := CONCAT(NEW.created_by, '.nodes.count');
          old_workspace_key := CONCAT(OLD.workspace_id, '.nodes.count');
          old_user_key := CONCAT(OLD.created_by, '.nodes.count');

          IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            UPDATE counters
            SET value = GREATEST(0, value - 1), updated_at = NOW()
            WHERE key = old_workspace_key;

            INSERT INTO counters (key, value, created_at, updated_at)
            VALUES (workspace_key, 1, NOW(), NOW())
            ON CONFLICT (key)
            DO UPDATE SET
              value = counters.value + 1,
              updated_at = NOW();
          END IF;

          IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
            UPDATE counters
            SET value = GREATEST(0, value - 1), updated_at = NOW()
            WHERE key = old_user_key;

            INSERT INTO counters (key, value, created_at, updated_at)
            VALUES (user_key, 1, NOW(), NOW())
            ON CONFLICT (key)
            DO UPDATE SET
              value = counters.value + 1,
              updated_at = NOW();
          END IF;

          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_node_counters ON nodes;

      CREATE TRIGGER trg_node_counters
      AFTER INSERT OR UPDATE OR DELETE ON nodes
      FOR EACH ROW
      EXECUTE FUNCTION fn_update_node_counters();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_node_counters ON nodes;
      DROP FUNCTION IF EXISTS fn_update_node_counters();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.nodes.count')
      .execute();
  },
};
