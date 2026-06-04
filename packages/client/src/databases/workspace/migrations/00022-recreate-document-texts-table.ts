import { Migration, sql } from 'kysely';

import { extractDocumentText } from '@colanode/core';

export const recreateDocumentTextsTable: Migration = {
    up: async (db) => {
        // 与 node_texts 同理：原表使用 contentless FTS5（content='', contentless_delete=1），
        // 无法 SELECT/JOIN 回 id/text，导致文档搜索失效。重建为常规 FTS5 并回填。
        await sql`DROP TABLE IF EXISTS document_texts;`.execute(db);
        await sql`
      CREATE VIRTUAL TABLE document_texts USING fts5(id UNINDEXED, text);
    `.execute(db);

        const result = await sql<{ id: string; content: string }>`
      SELECT id, content FROM documents
    `.execute(db);

        for (const row of result.rows) {
            let content: unknown;
            try {
                content = JSON.parse(row.content);
            } catch {
                continue;
            }

            const text = extractDocumentText(
                row.id,
                content as Parameters<typeof extractDocumentText>[1]
            );
            if (!text) {
                continue;
            }

            await sql`
        INSERT INTO document_texts (id, text)
        VALUES (${row.id}, ${text});
      `.execute(db);
        }
    },
    down: async (db) => {
        await sql`DROP TABLE IF EXISTS document_texts;`.execute(db);
        await sql`
      CREATE VIRTUAL TABLE document_texts USING fts5(id UNINDEXED, text, content='', contentless_delete=1);
    `.execute(db);
    },
};
