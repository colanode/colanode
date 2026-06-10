import { DatabaseSync } from 'node:sqlite';

import { Kysely, SqliteDialect } from 'kysely';

import {
    workspaceDatabaseMigrations,
    type WorkspaceDatabaseSchema,
} from '@colanode/client/databases';

// Minimal adapter that lets Kysely's SqliteDialect drive Node's built-in
// `node:sqlite` module. We use node:sqlite (instead of better-sqlite3) because
// the repo's better-sqlite3 is compiled against the Electron ABI and cannot be
// loaded by a plain Node test runner, whereas node:sqlite ships with Node.
class NodeSqliteStatement {
    constructor(
        private readonly stmt: ReturnType<DatabaseSync['prepare']>,
        private readonly sql: string
    ) { }

    get reader(): boolean {
        const head = this.sql.trimStart().slice(0, 6).toLowerCase();
        return (
            head.startsWith('select') ||
            head.startsWith('with') ||
            / returning /i.test(this.sql)
        );
    }

    all(parameters: ReadonlyArray<unknown>): unknown[] {
        return this.stmt.all(...(parameters as unknown[])) as unknown[];
    }

    run(parameters: ReadonlyArray<unknown>): {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
    } {
        const result = this.stmt.run(...(parameters as unknown[]));
        return {
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid,
        };
    }

    iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown> {
        return this.stmt.iterate(
            ...(parameters as unknown[])
        ) as IterableIterator<unknown>;
    }
}

class NodeSqliteDatabase {
    constructor(private readonly db: DatabaseSync) { }

    close(): void {
        this.db.close();
    }

    prepare(sql: string): NodeSqliteStatement {
        return new NodeSqliteStatement(this.db.prepare(sql), sql);
    }
}

export const createWorkspaceDatabaseUpTo = async (
    lastMigration: string
): Promise<Kysely<WorkspaceDatabaseSchema>> => {
    const sqlite = new DatabaseSync(':memory:', {
        enableForeignKeyConstraints: false,
    });

    const database = new Kysely<WorkspaceDatabaseSchema>({
        dialect: new SqliteDialect({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            database: new NodeSqliteDatabase(sqlite) as any,
        }),
    });

    const names = Object.keys(workspaceDatabaseMigrations).sort();
    for (const name of names) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workspaceDatabaseMigrations[name]!.up(database as Kysely<any>);
        if (name === lastMigration) {
            break;
        }
    }

    return database;
};

export const createWorkspaceDatabase = async (): Promise<
    Kysely<WorkspaceDatabaseSchema>
> => {
    const sqlite = new DatabaseSync(':memory:', {
        // Match the app's runtime, which does not enforce foreign keys (e.g.
        // applyRemoteNodeUpdate inserts node_updates before the owning nodes row).
        // node:sqlite enables FK constraints by default, so disable them here.
        enableForeignKeyConstraints: false,
    });

    const database = new Kysely<WorkspaceDatabaseSchema>({
        dialect: new SqliteDialect({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            database: new NodeSqliteDatabase(sqlite) as any,
        }),
    });

    const names = Object.keys(workspaceDatabaseMigrations).sort();
    for (const name of names) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await workspaceDatabaseMigrations[name]!.up(database as Kysely<any>);
    }

    return database;
};
