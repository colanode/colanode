import {
  SQLiteBindValue,
  SQLiteDatabase,
  SQLiteStatement,
  openDatabaseSync,
} from 'expo-sqlite';
import {
  CompiledQuery,
  type DatabaseConnection,
  type Dialect,
  type Driver,
  Kysely,
  type QueryResult,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from 'kysely';

import { KyselyBuildOptions, KyselyService } from '@colanode/client/services';
import { MobileFileSystem } from '@colanode/mobile/services/file-system';
import { MobilePathService } from '@colanode/mobile/services/path-service';

export class MobileKyselyService implements KyselyService {
  private readonly fs = new MobileFileSystem();

  public build<T>(options: KyselyBuildOptions): Kysely<T> {
    const dialect = new SqliteExpoDialect(options);

    return new Kysely<T>({
      dialect,
    });
  }

  public async delete(path: string): Promise<void> {
    await this.fs.delete(path);
  }
}

export class SqliteExpoDialect implements Dialect {
  private readonly options: KyselyBuildOptions;

  constructor(options: KyselyBuildOptions) {
    this.options = options;
  }

  createAdapter = () => new SqliteAdapter();
  createDriver = () => new ExpoSqliteDriver(this.options);
  createIntrospector = (db: Kysely<unknown>) => new SqliteIntrospector(db);
  createQueryCompiler = () => new SqliteQueryCompiler();
}

class ExpoSqliteDriver implements Driver {
  private readonly connectionMutex = new ConnectionMutex();
  private readonly connection: ExpoSqliteConnection;

  constructor(options: KyselyBuildOptions) {
    this.connection = new ExpoSqliteConnection(options);
  }

  async releaseConnection(): Promise<void> {
    this.connectionMutex.unlock();
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<ExpoSqliteConnection> {
    await this.connectionMutex.lock();
    return this.connection;
  }

  async beginTransaction(connection: ExpoSqliteConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'));
  }

  async commitTransaction(connection: ExpoSqliteConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'));
  }

  async rollbackTransaction(connection: ExpoSqliteConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'));
  }

  async destroy(): Promise<void> {
    await this.connection.closeConnection();
  }
}

class ExpoSqliteConnection implements DatabaseConnection {
  private readonly database: SQLiteDatabase;
  private readonly options: KyselyBuildOptions;
  private readonly paths: MobilePathService = new MobilePathService();

  constructor(options: KyselyBuildOptions) {
    const databaseName = this.paths.filename(options.path);
    const databaseDirectory = this.paths.dirname(options.path);

    this.database = openDatabaseSync(
      databaseName,
      undefined,
      databaseDirectory
    );
    this.options = options;
  }

  async closeConnection(): Promise<void> {
    return this.database.closeAsync();
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const sql = compiledQuery.sql;
    const parameters = compiledQuery.parameters as SQLiteBindValue[];
    let statement: SQLiteStatement | undefined;
    try {
      statement = await this.database.prepareAsync(sql);
      const result = await statement.executeAsync<R>(parameters);
      const rows = await result.getAllAsync();
      return {
        rows,
        insertId: BigInt(result.lastInsertRowId),
        numAffectedRows: BigInt(result.changes),
        numChangedRows: BigInt(result.changes),
      };
    } catch (error) {
      console.error('error', error);
      console.log('sql', sql);
      console.log('parameters', parameters);
      return {
        rows: [],
        insertId: BigInt(0),
        numAffectedRows: BigInt(0),
        numChangedRows: BigInt(0),
      };
    } finally {
      await statement?.finalizeAsync();
    }
  }

  streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error(
      'Expo SQLite driver does not support iterate on prepared statements'
    );
  }
}

class ConnectionMutex {
  private promise?: Promise<void>;
  private resolve?: () => void;

  async lock(): Promise<void> {
    while (this.promise) {
      await this.promise;
    }

    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  unlock(): void {
    const resolve = this.resolve;

    this.promise = undefined;
    this.resolve = undefined;

    resolve?.();
  }
}
