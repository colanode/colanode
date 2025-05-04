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
import { createDebugger } from '@colanode/core';

import { databaseMigrations } from '@/data/migrations';
import { DatabaseSchema } from '@/data/schema';
import { config } from '@/lib/config';

const debug = createDebugger('server:database');

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (val) => {
  return parseFloat(val);
});

pg.types.setTypeParser(pg.types.builtins.INT4, (val) => {
  return parseInt(val);
});

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: config.postgres.url,
    ssl:
      config.postgres.ssl &&
      Object.values(config.postgres.ssl).some((value) => value)
        ? config.postgres.ssl
        : undefined,
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

  const result = await migrator.migrateToLatest();
  if (result.error) {
    debug(`Migration failed, ${result.error}`);
  }

  if (result.results && result.results.length > 0) {
    for (const r of result.results) {
      debug(
        `Migration result: ${r.direction} - ${r.migrationName} - ${r.status} `
      );
    }
  }
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
