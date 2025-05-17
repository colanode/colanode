import { KyselyService } from '@colanode/client/services';
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
import sqlite3InitModule, {
  type BindableValue,
  type Database,
} from '@sqlite.org/sqlite-wasm';

export class WebKyselyService implements KyselyService {
  build<T>(path: string): Kysely<T> {
    console.log('build kysely', path);
    const dialect = new SqliteWasmDialect(path);

    return new Kysely<T>({
      dialect,
    });
  }
}

export class SqliteWasmDialect implements Dialect {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  createAdapter = () => new SqliteAdapter();
  createDriver = () => new SqliteWasmDriver(this.path);
  createIntrospector = (db: Kysely<unknown>) => new SqliteIntrospector(db);
  createQueryCompiler = () => new SqliteQueryCompiler();
}

class SqliteWasmDriver implements Driver {
  private readonly mutex = new ConnectionMutex();
  private readonly path: string;

  private database?: Database;
  private connection?: DatabaseConnection;

  constructor(path: string) {
    this.path = path;
  }

  async init(): Promise<void> {
    const sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });

    const pool = await sqlite3.installOpfsSAHPoolVfs({});
    this.database = new pool.OpfsSAHPoolDb(this.path);
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
    this.database?.close();
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
