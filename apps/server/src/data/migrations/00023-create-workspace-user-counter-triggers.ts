import { Migration, sql } from 'kysely';

export const createWorkspaceUserCounterTriggers: Migration = {
  up: async (db) => {
    await db
      .insertInto('counters')
      .columns(['key', 'value', 'created_at'])
      .expression((eb) =>
        eb
          .selectFrom('users')
          .select([
            eb
              .fn('concat', [
                eb.cast(eb.val(''), 'varchar'),
                eb.ref('workspace_id'),
                eb.cast(eb.val('.users.count'), 'varchar'),
              ])
              .as('key'),
            eb.fn.count('id').as('value'),
            eb.val(new Date()).as('created_at'),
          ])
          .groupBy('workspace_id')
      )
      .execute();

    // Create trigger function to increment user counter on user insert
    await sql`
      CREATE OR REPLACE FUNCTION fn_increment_workspace_user_counter() RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO counters (key, value, created_at, updated_at)
        VALUES (
          CONCAT(NEW.workspace_id, '.users.count'),
          1,
          NOW(),
          NOW()
        )
        ON CONFLICT (key)
        DO UPDATE SET
          value = counters.value + 1,
          updated_at = NOW();

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_increment_workspace_user_counter
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION fn_increment_workspace_user_counter();
    `.execute(db);

    // Create trigger function to decrement user counter on user delete
    await sql`
      CREATE OR REPLACE FUNCTION fn_decrement_workspace_user_counter() RETURNS TRIGGER AS $$
      BEGIN
        UPDATE counters
        SET 
          value = GREATEST(0, value - 1),
          updated_at = NOW()
        WHERE key = CONCAT(OLD.workspace_id, '.users.count');

        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_decrement_workspace_user_counter
      AFTER DELETE ON users
      FOR EACH ROW
      EXECUTE FUNCTION fn_decrement_workspace_user_counter();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_increment_workspace_user_counter ON users;
      DROP TRIGGER IF EXISTS trg_decrement_workspace_user_counter ON users;
      DROP FUNCTION IF EXISTS fn_increment_workspace_user_counter();
      DROP FUNCTION IF EXISTS fn_decrement_workspace_user_counter();
    `.execute(db);
  },
};
