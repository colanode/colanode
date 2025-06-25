import { sql, Migration } from 'kysely';

export const removeNodeUpdateRevisionTrigger: Migration = {
  up: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_node_update_revision ON node_updates;
      DROP FUNCTION IF EXISTS update_node_update_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      CREATE OR REPLACE FUNCTION update_node_update_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('node_updates_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_update_revision
      BEFORE UPDATE ON node_updates
      FOR EACH ROW
      EXECUTE FUNCTION update_node_update_revision();
    `.execute(db);
  },
};
