import { Migration } from 'kysely';

export const createJobSchedulesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('job_schedules')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('queue', 'text', (col) => col.notNull())
      .addColumn('input', 'text', (col) => col.notNull())
      .addColumn('options', 'text')
      .addColumn('status', 'integer', (col) => col.notNull().defaultTo(1))
      .addColumn('interval', 'integer', (col) => col.notNull())
      .addColumn('next_run_at', 'text', (col) => col.notNull())
      .addColumn('last_run_at', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text', (col) => col.notNull())
      .execute();

    await db.schema
      .createIndex('idx_job_schedules_next_run')
      .on('job_schedules')
      .columns(['status', 'next_run_at'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('job_schedules').execute();
  },
};
