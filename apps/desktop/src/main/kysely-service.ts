import { KyselyService } from '@colanode/client/services';
import { Kysely, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';

export class DesktopKyselyService implements KyselyService {
  build<T>(path: string): Kysely<T> {
    const database = new SQLite(path);
    database.pragma('journal_mode = WAL');

    return new Kysely<T>({
      dialect: new SqliteDialect({
        database,
      }),
    });
  }
}
