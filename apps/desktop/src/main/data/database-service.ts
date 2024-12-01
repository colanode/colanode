import SQLite from 'better-sqlite3';
import { Kysely, Migration, Migrator, SqliteDialect } from 'kysely';
import fs from 'fs';

import { appDatabaseMigrations } from '@/main/data/app/migrations';
import { AppDatabaseSchema } from '@/main/data/app/schema';
import { workspaceDatabaseMigrations } from '@/main/data/workspace/migrations';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { createLogger } from '@/main/logger';
import { appDatabasePath, getWorkspaceDirectoryPath } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

class DatabaseService {
  private initPromise: Promise<void> | null = null;
  private readonly workspaceDatabases: Map<
    string,
    Kysely<WorkspaceDatabaseSchema>
  > = new Map();

  public readonly appDatabase: Kysely<AppDatabaseSchema>;
  private readonly logger = createLogger('database-service');

  constructor() {
    this.logger.debug('Constructing database service');
    const dialect = new SqliteDialect({
      database: this.buildSqlite(appDatabasePath),
    });

    this.appDatabase = new Kysely<AppDatabaseSchema>({ dialect });

    eventBus.subscribe((event) => {
      if (event.type === 'workspace_created') {
        this.initWorkspaceDatabase(event.workspace.userId);
      }
    });
  }

  public async init(): Promise<void> {
    this.logger.debug('Initializing database service');
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    await this.initPromise;
  }

  public async getWorkspaceDatabase(
    userId: string
  ): Promise<Kysely<WorkspaceDatabaseSchema>> {
    await this.waitForInit();

    if (this.workspaceDatabases.has(userId)) {
      return this.workspaceDatabases.get(userId)!;
    }

    //try and check if it's in database but hasn't been loaded yet
    const workspace = await this.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace database not found');
    }

    const workspaceDatabase = await this.initWorkspaceDatabase(userId);
    this.workspaceDatabases.set(userId, workspaceDatabase);
    return workspaceDatabase;
  }

  public async getWorkspaceDatabases(): Promise<
    Map<string, Kysely<WorkspaceDatabaseSchema>>
  > {
    await this.waitForInit();
    return this.workspaceDatabases;
  }

  public async deleteWorkspaceDatabase(userId: string): Promise<void> {
    this.logger.debug(`Deleting workspace database for user: ${userId}`);
    await this.waitForInit();

    if (this.workspaceDatabases.has(userId)) {
      this.workspaceDatabases.delete(userId);
    }
  }

  private async waitForInit(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    await this.initPromise;
  }

  private async executeInit(): Promise<void> {
    await this.migrateAppDatabase();

    const workspaces = await this.appDatabase
      .selectFrom('workspaces')
      .select('user_id')
      .execute();

    for (const workspace of workspaces) {
      const workspaceDatabase = await this.initWorkspaceDatabase(
        workspace.user_id
      );

      this.workspaceDatabases.set(workspace.user_id, workspaceDatabase);
    }
  }

  private async initWorkspaceDatabase(
    userId: string
  ): Promise<Kysely<WorkspaceDatabaseSchema>> {
    this.logger.debug(`Initializing workspace database for user: ${userId}`);
    const workspaceDir = getWorkspaceDirectoryPath(userId);

    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, {
        recursive: true,
      });
    }

    const dialect = new SqliteDialect({
      database: this.buildSqlite(`${workspaceDir}/workspace.db`),
    });

    const workspaceDatabase = new Kysely<WorkspaceDatabaseSchema>({
      dialect,
    });

    await this.migrateWorkspaceDatabase(workspaceDatabase);
    return workspaceDatabase;
  }

  private async migrateAppDatabase(): Promise<void> {
    this.logger.debug('Migrating app database');
    const migrator = new Migrator({
      db: this.appDatabase,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(appDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }

  private async migrateWorkspaceDatabase(
    database: Kysely<WorkspaceDatabaseSchema>
  ): Promise<void> {
    this.logger.debug('Migrating workspace database');
    const migrator = new Migrator({
      db: database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }

  private buildSqlite = (filename: string): SQLite.Database => {
    this.logger.debug(`Building sqlite database: ${filename}`);
    const database = new SQLite(filename);
    database.pragma('journal_mode = WAL');
    return database;
  };
}

export const databaseService = new DatabaseService();
