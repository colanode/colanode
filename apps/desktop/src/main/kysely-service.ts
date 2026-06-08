import fs from 'fs';
import path from 'path';

import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import { KyselyBuildOptions, KyselyService } from '@colanode/client/services';

export class DesktopKyselyService implements KyselyService {
  build<T>(options: KyselyBuildOptions): Kysely<T> {
    const dir = path.dirname(options.path);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const database = new SQLite(options.path, {
      readonly: options.readonly,
    });

    // better-sqlite3 enables foreign keys by default, but the app's write
    // paths intentionally violate child-before-parent ordering (e.g.
    // applyRemoteNodeUpdate inserts node_updates before the owning nodes row)
    // and rely on explicit deleteNodeRelations cleanup instead of CASCADE.
    database.pragma('foreign_keys = OFF');

    if (!options.readonly) {
      database.pragma('journal_mode = WAL');
    }

    return new Kysely<T>({
      dialect: new SqliteDialect({
        database,
      }),
    });
  }

  async delete(path: string): Promise<void> {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  }
}
