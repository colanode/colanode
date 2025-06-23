import { Migration, sql } from 'kysely';

export const createUserUploadCounterTriggers: Migration = {
  up: async (db) => {
    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at'])
      .expression((eb) =>
        eb
          .selectFrom('uploads')
          .select([
            eb
              .fn('concat', [
                eb.ref('created_by'),
                eb.cast(eb.val('.storage.used'), 'varchar'),
              ])
              .as('key'),
            eb.fn.sum('size').as('value'),
            eb.val(new Date()).as('created_at'),
          ])
          .groupBy('created_by')
      )
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION fn_increment_user_storage_counter() RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO counters (key, value, created_at, updated_at)
        VALUES (
          CONCAT(NEW.created_by, '.storage.used'),
          NEW.size,
          NOW(),
          NOW()
        )
        ON CONFLICT (key)
        DO UPDATE SET
          value = counters.value + NEW.size,
          updated_at = NOW();

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_increment_user_storage_counter
      AFTER INSERT ON uploads
      FOR EACH ROW
      EXECUTE FUNCTION fn_increment_user_storage_counter();
    `.execute(db);

    await sql`
      CREATE OR REPLACE FUNCTION fn_decrement_user_storage_counter() RETURNS TRIGGER AS $$
      BEGIN
        UPDATE counters
        SET 
          value = GREATEST(0, value - OLD.size),
          updated_at = NOW()
        WHERE key = CONCAT(OLD.created_by, '.storage.used');

        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_decrement_user_storage_counter
      AFTER DELETE ON uploads
      FOR EACH ROW
      EXECUTE FUNCTION fn_decrement_user_storage_counter();
    `.execute(db);

    await sql`
      CREATE OR REPLACE FUNCTION fn_update_user_storage_counter() RETURNS TRIGGER AS $$
      DECLARE
        size_difference BIGINT;
      BEGIN
        IF OLD.size IS DISTINCT FROM NEW.size THEN
          size_difference := NEW.size - OLD.size;
          
          UPDATE counters
          SET 
            value = GREATEST(0, value + size_difference),
            updated_at = NOW()
          WHERE key = CONCAT(NEW.created_by, '.storage.used');
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_user_storage_counter
      AFTER UPDATE ON uploads
      FOR EACH ROW
      EXECUTE FUNCTION fn_update_user_storage_counter();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_user_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_decrement_user_storage_counter ON uploads;
      DROP TRIGGER IF EXISTS trg_update_user_storage_counter ON uploads;
      DROP FUNCTION IF EXISTS fn_increment_user_storage_counter();
      DROP FUNCTION IF EXISTS fn_decrement_user_storage_counter();
      DROP FUNCTION IF EXISTS fn_update_user_storage_counter();
    `.execute(db);
  },
};
