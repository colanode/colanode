import sqlite3InitModule, {
  SAHPoolUtil,
  Sqlite3Static,
  type BindableValue,
  type Database,
} from '@sqlite.org/sqlite-wasm';
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
import { WebFileSystem } from '@colanode/web/services/file-system';

export class WebKyselyService implements KyselyService {
  private readonly pools: Map<string, SAHPoolUtil> = new Map();
  private sqlite3?: Sqlite3Static;

  public build<T>(options: KyselyBuildOptions): Kysely<T> {
    const dialect = new SqliteWasmDialect(this, options);

    return new Kysely<T>({
      dialect,
    });
  }

  public async delete(path: string): Promise<void> {
    const pool = this.pools.get(path);
    if (pool) {
      await pool.removeVfs();
      this.pools.delete(path);
    } else {
      if (!this.sqlite3) {
        this.sqlite3 = await sqlite3InitModule({
          print: console.log,
          printErr: console.error,
        });
      }

      const pool = await this.sqlite3.installOpfsSAHPoolVfs({
        name: this.buildVfsName(path),
      });

      pool.removeVfs();
    }
  }

  public async buildPool(path: string): Promise<SAHPoolUtil> {
    if (!this.sqlite3) {
      this.sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
      });
    }

    const pool = await this.sqlite3.installOpfsSAHPoolVfs({
      name: this.buildVfsName(path),
    });

    this.pools.set(path, pool);
    return pool;
  }

  private buildVfsName(path: string): string {
    return path.replace(/\//g, '_').split('.')[0]!;
  }
}

export class SqliteWasmDialect implements Dialect {
  private readonly kysely: WebKyselyService;
  private readonly options: KyselyBuildOptions;

  constructor(kysely: WebKyselyService, options: KyselyBuildOptions) {
    this.kysely = kysely;
    this.options = options;
  }

  createAdapter = () => new SqliteAdapter();
  createDriver = () => new SqliteWasmDriver(this.kysely, this.options);
  createIntrospector = (db: Kysely<unknown>) => new SqliteIntrospector(db);
  createQueryCompiler = () => new SqliteQueryCompiler();
}

class SqliteWasmDriver implements Driver {
  private readonly fs = new WebFileSystem();
  private readonly mutex = new ConnectionMutex();
  private readonly kysely: WebKyselyService;
  private readonly options: KyselyBuildOptions;

  private database?: Database;
  private connection?: DatabaseConnection;

  constructor(kysely: WebKyselyService, options: KyselyBuildOptions) {
    this.kysely = kysely;
    this.options = options;
  }

  async init(): Promise<void> {
    const pool = await this.kysely.buildPool(this.options.path);

    if (this.options.readonly) {
      const databaseExists = await this.fs.exists(this.options.path);
      if (databaseExists) {
        const databaseContent = await this.fs.readFile(this.options.path);
        await pool.importDb(this.buildImportDbPath(), databaseContent);
      }
    }

    this.database = new pool.OpfsSAHPoolDb(this.options.path);
    this.connection = new SqliteConnection(this.database);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.mutex.lock();
    return this.connection!;
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'));
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'));
  }

  async releaseConnection(): Promise<void> {
    this.mutex.unlock();
  }

  async destroy(): Promise<void> {
    try {
      this.database?.close();
    } catch {
      // Ignore errors
    }
  }

  private buildImportDbPath(): string {
    return this.options.path.startsWith('/')
      ? this.options.path
      : '/' + this.options.path;
  }
}

class SqliteConnection implements DatabaseConnection {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const sql = compiledQuery.sql;
    const parameters = compiledQuery.parameters as readonly BindableValue[];
    const columns: string[] = [];

    const result = this.database.exec({
      sql: sql,
      bind: parameters,
      returnValue: 'resultRows',
      rowMode: 'array',
      columnNames: columns,
    });

    const rows = this.convertRowsToObjects(result, columns);
    return Promise.resolve({ rows: rows as O[] });
  }

  // eslint-disable-next-line require-yield
  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error(
      'Sqlite wasm driver only supports streaming of select queries'
    );
  }

  private isArrayOfArrays(rows: unknown[] | unknown[][]): rows is unknown[][] {
    return !rows.some((row) => !Array.isArray(row));
  }

  private convertRowsToObjects(
    rows: unknown[] | unknown[][],
    columns: string[]
  ): Record<string, unknown>[] {
    let checkedRows: unknown[][];

    if (this.isArrayOfArrays(rows)) {
      checkedRows = rows;
    } else {
      checkedRows = [rows];
    }

    return checkedRows.map((row) => {
      const rowObj = {} as Record<string, unknown>;
      columns.forEach((column, columnIndex) => {
        rowObj[column] = row[columnIndex];
      });

      return rowObj;
    });
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
