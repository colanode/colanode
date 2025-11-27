import { Migration, sql } from 'kysely';

export const createUploadUsageCounterTriggers: Migration = {
  up: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_workspace_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_decrement_workspace_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_update_workspace_storage_counter ON uploads;
      DROP FUNCTION IF EXISTS fn_increment_workspace_storage_counter();
      DROP FUNCTION IF EXISTS fn_decrement_workspace_storage_counter();
      DROP FUNCTION IF EXISTS fn_update_workspace_storage_counter();
      DROP TRIGGER IF EXISTS trg_increment_user_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_decrement_user_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_update_user_storage_counter ON uploads;
      DROP FUNCTION IF EXISTS fn_increment_user_storage_counter();
      DROP FUNCTION IF EXISTS fn_decrement_user_storage_counter();
      DROP FUNCTION IF EXISTS fn_update_user_storage_counter();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.storage.used')
      .execute();

    const now = new Date();

    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at', 'updated_at'])
      .expression((eb) =>
        eb
          .selectFrom('uploads')
          .select([
            eb
              .fn('concat', [
                eb.ref('workspace_id'),
                eb.cast(eb.val('.uploads.size'), 'varchar'),
              ])
              .as('key'),
            eb.fn.sum('size').as('value'),
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
          .selectFrom('uploads')
          .select([
            eb
              .fn('concat', [
                eb.ref('workspace_id'),
                eb.cast(eb.val('.uploads.count'), 'varchar'),
              ])
              .as('key'),
            eb.fn.countAll().as('value'),
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
          .selectFrom('uploads')
          .select([
            eb
              .fn('concat', [
                eb.ref('created_by'),
                eb.cast(eb.val('.uploads.size'), 'varchar'),
              ])
              .as('key'),
            eb.fn.sum('size').as('value'),
            eb.val(now).as('created_at'),
            eb.val(now).as('updated_at'),
          ])
          .groupBy('created_by')
      )
      .execute();

    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at', 'updated_at'])
      .expression((eb) =>
        eb
          .selectFrom('uploads')
          .select([
            eb
              .fn('concat', [
                eb.ref('created_by'),
                eb.cast(eb.val('.uploads.count'), 'varchar'),
              ])
              .as('key'),
            eb.fn.countAll().as('value'),
            eb.val(now).as('created_at'),
            eb.val(now).as('updated_at'),
          ])
          .groupBy('created_by')
      )
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION fn_update_upload_usage_counters() RETURNS TRIGGER AS $$
      DECLARE
        workspace_size_key text;
        workspace_count_key text;
        user_size_key text;
        user_count_key text;
        old_workspace_size_key text;
        old_workspace_count_key text;
        old_user_size_key text;
        old_user_count_key text;
        size_difference bigint;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          workspace_size_key := CONCAT(NEW.workspace_id, '.uploads.size');
          workspace_count_key := CONCAT(NEW.workspace_id, '.uploads.count');
          user_size_key := CONCAT(NEW.created_by, '.uploads.size');
          user_count_key := CONCAT(NEW.created_by, '.uploads.count');

          INSERT INTO counters (key, value, created_at, updated_at)
          VALUES
            (workspace_size_key, NEW.size, NOW(), NOW()),
            (workspace_count_key, 1, NOW(), NOW()),
            (user_size_key, NEW.size, NOW(), NOW()),
            (user_count_key, 1, NOW(), NOW())
          ON CONFLICT (key)
          DO UPDATE SET
            value = counters.value + EXCLUDED.value,
            updated_at = NOW();

          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          workspace_size_key := CONCAT(OLD.workspace_id, '.uploads.size');
          workspace_count_key := CONCAT(OLD.workspace_id, '.uploads.count');
          user_size_key := CONCAT(OLD.created_by, '.uploads.size');
          user_count_key := CONCAT(OLD.created_by, '.uploads.count');

          UPDATE counters
          SET value = GREATEST(0, value - CASE
                WHEN key = workspace_size_key THEN OLD.size
                WHEN key = workspace_count_key THEN 1
                WHEN key = user_size_key THEN OLD.size
                WHEN key = user_count_key THEN 1
              END),
              updated_at = NOW()
          WHERE key IN (workspace_size_key, workspace_count_key, user_size_key, user_count_key);

          RETURN OLD;
        ELSE
          workspace_size_key := CONCAT(NEW.workspace_id, '.uploads.size');
          workspace_count_key := CONCAT(NEW.workspace_id, '.uploads.count');
          user_size_key := CONCAT(NEW.created_by, '.uploads.size');
          user_count_key := CONCAT(NEW.created_by, '.uploads.count');

          old_workspace_size_key := CONCAT(OLD.workspace_id, '.uploads.size');
          old_workspace_count_key := CONCAT(OLD.workspace_id, '.uploads.count');
          old_user_size_key := CONCAT(OLD.created_by, '.uploads.size');
          old_user_count_key := CONCAT(OLD.created_by, '.uploads.count');

          IF OLD.workspace_id IS DISTINCT FROM NEW.workspace_id THEN
            UPDATE counters
            SET value = GREATEST(0, value - CASE
                  WHEN key = old_workspace_size_key THEN OLD.size
                  WHEN key = old_workspace_count_key THEN 1
                END),
                updated_at = NOW()
            WHERE key IN (old_workspace_size_key, old_workspace_count_key);

            INSERT INTO counters (key, value, created_at, updated_at)
            VALUES
              (workspace_size_key, NEW.size, NOW(), NOW()),
              (workspace_count_key, 1, NOW(), NOW())
            ON CONFLICT (key)
            DO UPDATE SET
              value = counters.value + EXCLUDED.value,
              updated_at = NOW();
          ELSE
            size_difference := NEW.size - OLD.size;
            IF size_difference <> 0 THEN
              UPDATE counters
              SET value = GREATEST(0, value + size_difference),
                  updated_at = NOW()
              WHERE key = workspace_size_key;
            END IF;
          END IF;

          IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
            UPDATE counters
            SET value = GREATEST(0, value - CASE
                  WHEN key = old_user_size_key THEN OLD.size
                  WHEN key = old_user_count_key THEN 1
                END),
                updated_at = NOW()
            WHERE key IN (old_user_size_key, old_user_count_key);

            INSERT INTO counters (key, value, created_at, updated_at)
            VALUES
              (user_size_key, NEW.size, NOW(), NOW()),
              (user_count_key, 1, NOW(), NOW())
            ON CONFLICT (key)
            DO UPDATE SET
              value = counters.value + EXCLUDED.value,
              updated_at = NOW();
          ELSE
            size_difference := NEW.size - OLD.size;
            IF size_difference <> 0 THEN
              UPDATE counters
              SET value = GREATEST(0, value + size_difference),
                  updated_at = NOW()
              WHERE key = user_size_key;
            END IF;
          END IF;

          RETURN NEW;
        END IF;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_upload_usage_counters ON uploads;

      CREATE TRIGGER trg_upload_usage_counters
      AFTER INSERT OR UPDATE OR DELETE ON uploads
      FOR EACH ROW
      EXECUTE FUNCTION fn_update_upload_usage_counters();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_upload_usage_counters ON uploads;
      DROP FUNCTION IF EXISTS fn_update_upload_usage_counters();
    `.execute(db);
  },
};
