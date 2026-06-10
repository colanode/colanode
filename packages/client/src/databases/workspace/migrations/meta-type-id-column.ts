import { Kysely, sql } from 'kysely';

const columnExists = async (
  db: Kysely<unknown>,
  column: string
): Promise<boolean> => {
  const tableInfo = await sql<{ name: string }>`PRAGMA table_info(nodes)`.execute(
    db
  );

  if (tableInfo.rows.some((row) => row.name === column)) {
    return true;
  }

  try {
    await sql`SELECT ${sql.ref(column)} FROM nodes LIMIT 0`.execute(db);
    return true;
  } catch {
    return false;
  }
};

const indexExists = async (db: Kysely<unknown>, name: string): Promise<boolean> => {
  const result = await sql<{ name: string }>`
    SELECT name FROM sqlite_master WHERE type = 'index' AND name = ${name}
  `.execute(db);

  return result.rows.length > 0;
};

export const ensureNodesMetaTypeIdColumn = async (
  db: Kysely<unknown>
): Promise<void> => {
  if (!(await columnExists(db, 'meta_type_id'))) {
    // SQLite cannot ALTER TABLE ADD COLUMN ... STORED on existing tables.
    // Use a VIRTUAL generated column instead.
    await sql`
      ALTER TABLE nodes
      ADD COLUMN meta_type_id TEXT
      GENERATED ALWAYS AS (json_extract(attributes, '$.metaTypeId')) VIRTUAL
    `.execute(db);
  }

  if (!(await indexExists(db, 'nodes_meta_type_id_type_index'))) {
    await db.schema
      .createIndex('nodes_meta_type_id_type_index')
      .on('nodes')
      .columns(['meta_type_id', 'type'])
      .execute();
  }
};
