import { sql, Migration } from 'kysely';

export const removeDocumentUpdateRevisionTrigger: Migration = {
  up: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_document_update_revision ON document_updates;
      DROP FUNCTION IF EXISTS update_document_update_revision();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      CREATE OR REPLACE FUNCTION update_document_update_revision() RETURNS TRIGGER AS $$
      BEGIN
        NEW.revision = nextval('document_updates_revision_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_document_update_revision
      BEFORE UPDATE ON document_updates
      FOR EACH ROW
      EXECUTE FUNCTION update_document_update_revision();
    `.execute(db);
  },
};
