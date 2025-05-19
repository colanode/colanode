import { KyselyBuildOptions, KyselyService } from '@colanode/client/services';
import { Kysely, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';

import path from 'path';
import fs from 'fs';

export class DesktopKyselyService implements KyselyService {
  build<T>(options: KyselyBuildOptions): Kysely<T> {
    const dir = path.dirname(options.path);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const database = new SQLite(options.path, {
      readonly: options.readonly,
    });

    database.pragma('journal_mode = WAL');

    return new Kysely<T>({
      dialect: new SqliteDialect({
        database,
      }),
    });
  }
}
