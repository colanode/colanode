import { Migration, sql } from 'kysely';

import { getNodeModel, NodeAttributes } from '@colanode/core';

export const recreateNodeTextsTable: Migration = {
    up: async (db) => {
        // The original node_texts table was created as a contentless FTS5 table
        // (content='', contentless_delete=1). Contentless tables do not store the
        // original column values, so SELECT/JOIN on id/name/attributes always
        // returns NULL. This broke every search that joins back to nodes on
        // node_texts.id. Recreate the table as a regular FTS5 table and reindex.
        await sql`DROP TABLE IF EXISTS node_texts;`.execute(db);
        await sql`
      CREATE VIRTUAL TABLE node_texts USING fts5(id UNINDEXED, name, attributes);
    `.execute(db);

        const result = await sql<{ id: string; attributes: string }>`
      SELECT id, attributes FROM nodes
    `.execute(db);

        for (const row of result.rows) {
            let attributes: NodeAttributes;
            try {
                attributes = JSON.parse(row.attributes) as NodeAttributes;
            } catch {
                continue;
            }

            const model = getNodeModel(attributes.type);
            if (!model) {
                continue;
            }

            const nodeText = model.extractText(row.id, attributes);
            if (!nodeText) {
                continue;
            }

            await sql`
        INSERT INTO node_texts (id, name, attributes)
        VALUES (${row.id}, ${nodeText.name ?? null}, ${nodeText.attributes ?? null});
      `.execute(db);
        }
    },
    down: async (db) => {
        await sql`DROP TABLE IF EXISTS node_texts;`.execute(db);
        await sql`
      CREATE VIRTUAL TABLE node_texts USING fts5(id UNINDEXED, name, attributes, content='', contentless_delete=1);
    `.execute(db);
    },
};
