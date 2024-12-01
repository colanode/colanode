import {
  DeleteResult,
  InsertResult,
  Kysely,
  Migration,
  Migrator,
  PostgresDialect,
  UpdateResult,
} from 'kysely';
import pg from 'pg';

import { databaseMigrations } from '@/data/migrations';
import { DatabaseSchema } from '@/data/schema';

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

export const database = new Kysely<DatabaseSchema>({
  dialect,
});

export const migrate = async () => {
  const migrator = new Migrator({
    db: database,
    provider: {
      getMigrations(): Promise<Record<string, Migration>> {
        return Promise.resolve(databaseMigrations);
      },
    },
  });

  await migrator.migrateToLatest();
};

export const hasInsertChanges = (result: InsertResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some(
    (r) => r.numInsertedOrUpdatedRows && r.numInsertedOrUpdatedRows > 0n
  );
};

export const hasUpdateChanges = (result: UpdateResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some((r) => r.numUpdatedRows && r.numUpdatedRows > 0n);
};

export const hasDeleteChanges = (result: DeleteResult[]): boolean => {
  return result.some((r) => r.numDeletedRows && r.numDeletedRows > 0n);
};
