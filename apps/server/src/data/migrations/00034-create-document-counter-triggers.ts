import { Migration, sql } from 'kysely';

export const createDocumentCounterTriggers: Migration = {
  up: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_document_counters ON documents;
      DROP FUNCTION IF EXISTS fn_update_document_counters();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.documents.count')
      .execute();

    const now = new Date();

    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at', 'updated_at'])
      .expression((eb) =>
        eb
          .selectFrom('documents')
          .select([
            eb
              .fn('concat', [
                eb.ref('workspace_id'),
                eb.cast(eb.val('.documents.count'), 'varchar'),
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
          .selectFrom('documents')
          .select([
            eb
              .fn('concat', [
                eb.ref('created_by'),
                eb.cast(eb.val('.documents.count'), 'varchar'),
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
      CREATE OR REPLACE FUNCTION fn_update_document_counters() RETURNS TRIGGER AS $$
      DECLARE
        workspace_key text;
        user_key text;
        old_workspace_key text;
        old_user_key text;
      BEGIN
        IF TG_OP = 'INSERT' THEN
          workspace_key := CONCAT(NEW.workspace_id, '.documents.count');
          user_key := CONCAT(NEW.created_by, '.documents.count');

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
          workspace_key := CONCAT(OLD.workspace_id, '.documents.count');
          user_key := CONCAT(OLD.created_by, '.documents.count');

          UPDATE counters
          SET value = GREATEST(0, value - 1), updated_at = NOW()
          WHERE key IN (workspace_key, user_key);

          RETURN OLD;
        ELSE
          workspace_key := CONCAT(NEW.workspace_id, '.documents.count');
          user_key := CONCAT(NEW.created_by, '.documents.count');
          old_workspace_key := CONCAT(OLD.workspace_id, '.documents.count');
          old_user_key := CONCAT(OLD.created_by, '.documents.count');

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

      DROP TRIGGER IF EXISTS trg_document_counters ON documents;

      CREATE TRIGGER trg_document_counters
      AFTER INSERT OR UPDATE OR DELETE ON documents
      FOR EACH ROW
      EXECUTE FUNCTION fn_update_document_counters();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_document_counters ON documents;
      DROP FUNCTION IF EXISTS fn_update_document_counters();
    `.execute(db);

    await db
      .deleteFrom('counters')
      .where('key', 'like', '%.documents.count')
      .execute();
  },
};
