import { Migration, sql } from 'kysely';

export const createNodeEmbeddingsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_embeddings')
      .addColumn('node_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('chunk', 'integer', (col) => col.notNull())
      .addColumn('revision', 'bigint', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('text', 'text', (col) => col.notNull())
      .addColumn('summary', 'text')
      .addColumn('embedding_vector', sql`vector(2000)`, (col) => col.notNull())
      .addColumn(
        'search_vector',
        sql`tsvector GENERATED ALWAYS AS (
          setweight(to_tsvector('english', COALESCE(text, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(summary, '')), 'B')
        ) STORED`
      )
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addPrimaryKeyConstraint('node_embeddings_pkey', ['node_id', 'chunk'])
      .execute();

    await sql`
      CREATE INDEX node_embeddings_embedding_vector_idx
        ON node_embeddings
        USING hnsw(embedding_vector vector_cosine_ops)
        WITH (
          m = 16,            
          ef_construction = 64  
        );
    `.execute(db);

    await sql`
      CREATE INDEX node_embeddings_search_vector_idx
        ON node_embeddings
        USING GIN (search_vector);
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('node_embeddings').execute();
  },
};
