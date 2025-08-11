import { Migration } from 'kysely';

export const createJobsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('jobs')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('queue', 'text', (col) => col.notNull())
      .addColumn('input', 'text', (col) => col.notNull())
      .addColumn('options', 'text')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('retries', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('scheduled_at', 'text', (col) => col.notNull())
      .addColumn('deduplication_key', 'text')
      .addColumn('concurrency_key', 'text')
      .addColumn('schedule_id', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text', (col) => col.notNull())
      .execute();

    await db.schema
      .createIndex('idx_jobs_queue_scheduled')
      .on('jobs')
      .columns(['queue', 'scheduled_at'])
      .execute();

    await db.schema
      .createIndex('idx_jobs_deduplication')
      .on('jobs')
      .columns(['deduplication_key'])
      .where('deduplication_key', 'is not', null)
      .execute();

    await db.schema
      .createIndex('idx_jobs_concurrency')
      .on('jobs')
      .columns(['concurrency_key', 'status'])
      .where('concurrency_key', 'is not', null)
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('jobs').execute();
  },
};
