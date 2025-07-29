import { Kysely, Migration, Migrator } from 'kysely';
import ms from 'ms';

import {
  WorkspaceDatabaseSchema,
  workspaceDatabaseMigrations,
} from '@colanode/client/databases/workspace';
import { eventBus } from '@colanode/client/lib/event-bus';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { CollaborationService } from '@colanode/client/services/workspaces/collaboration-service';
import { DocumentService } from '@colanode/client/services/workspaces/document-service';
import { FileService } from '@colanode/client/services/workspaces/file-service';
import { MutationService } from '@colanode/client/services/workspaces/mutation-service';
import { NodeCountersService } from '@colanode/client/services/workspaces/node-counters-service';
import { NodeInteractionService } from '@colanode/client/services/workspaces/node-interaction-service';
import { NodeReactionService } from '@colanode/client/services/workspaces/node-reaction-service';
import { NodeService } from '@colanode/client/services/workspaces/node-service';
import { RadarService } from '@colanode/client/services/workspaces/radar-service';
import { SyncService } from '@colanode/client/services/workspaces/sync-service';
import { UserService } from '@colanode/client/services/workspaces/user-service';
import { Workspace } from '@colanode/client/types/workspaces';
import { createDebugger, WorkspaceRole } from '@colanode/core';

const debug = createDebugger('desktop:service:workspace');

export class WorkspaceService {
  private readonly workspace: Workspace;

  public readonly database: Kysely<WorkspaceDatabaseSchema>;
  public readonly account: AccountService;
  public readonly nodes: NodeService;
  public readonly documents: DocumentService;
  public readonly nodeInteractions: NodeInteractionService;
  public readonly nodeReactions: NodeReactionService;
  public readonly files: FileService;
  public readonly mutations: MutationService;
  public readonly users: UserService;
  public readonly collaborations: CollaborationService;
  public readonly synchronizer: SyncService;
  public readonly radar: RadarService;
  public readonly nodeCounters: NodeCountersService;

  private readonly workspaceFilesCleanJobScheduleId: string;

  constructor(workspace: Workspace, account: AccountService) {
    debug(`Initializing workspace service ${workspace.id}`);

    this.workspace = workspace;
    this.account = account;

    this.database = account.app.kysely.build<WorkspaceDatabaseSchema>({
      path: account.app.path.workspaceDatabase(
        this.account.id,
        this.workspace.id
      ),
      readonly: false,
    });

    this.nodes = new NodeService(this);
    this.nodeInteractions = new NodeInteractionService(this);
    this.nodeReactions = new NodeReactionService(this);
    this.documents = new DocumentService(this);
    this.files = new FileService(this);
    this.mutations = new MutationService(this);
    this.users = new UserService(this);
    this.collaborations = new CollaborationService(this);
    this.synchronizer = new SyncService(this);
    this.radar = new RadarService(this);
    this.nodeCounters = new NodeCountersService(this);

    this.workspaceFilesCleanJobScheduleId = `workspace.files.clean.${this.account.id}.${this.workspace.id}`;
  }

  public get id(): string {
    return this.workspace.id;
  }

  public get accountId(): string {
    return this.workspace.accountId;
  }

  public get userId(): string {
    return this.workspace.userId;
  }

  public get role(): WorkspaceRole {
    return this.workspace.role;
  }

  public get maxFileSize(): string {
    return this.workspace.maxFileSize;
  }

  public get storageLimit(): string {
    return this.workspace.storageLimit;
  }

  public updateWorkspace(workspace: Workspace): void {
    this.workspace.name = workspace.name;
    this.workspace.description = workspace.description;
    this.workspace.avatar = workspace.avatar;
    this.workspace.role = workspace.role;
  }

  public async init() {
    await this.migrate();
    await this.collaborations.init();
    await this.synchronizer.init();
    await this.radar.init();
    await this.files.init();

    await this.account.app.jobs.upsertJobSchedule(
      this.workspaceFilesCleanJobScheduleId,
      {
        type: 'workspace.files.clean',
        accountId: this.account.id,
        workspaceId: this.workspace.id,
      },
      ms('1 minute'),
      {
        deduplication: {
          key: this.workspaceFilesCleanJobScheduleId,
          replace: true,
        },
      }
    );
  }

  private async migrate(): Promise<void> {
    debug(`Migrating workspace database for workspace ${this.workspace.id}`);

    const migrator = new Migrator({
      db: this.database,
      provider: {
        getMigrations(): Promise<Record<string, Migration>> {
          return Promise.resolve(workspaceDatabaseMigrations);
        },
      },
    });

    await migrator.migrateToLatest();
  }

  public async delete(): Promise<void> {
    try {
      this.database.destroy();
      this.synchronizer.destroy();
      this.radar.destroy();

      const databasePath = this.account.app.path.workspaceDatabase(
        this.account.id,
        this.workspace.id
      );

      await this.account.app.kysely.delete(databasePath);

      const workspacePath = this.account.app.path.workspace(
        this.account.id,
        this.workspace.id
      );

      await this.account.app.fs.delete(workspacePath);

      await this.account.database
        .deleteFrom('workspaces')
        .where('id', '=', this.workspace.id)
        .execute();

      await this.account.app.jobs.removeJobSchedule(
        this.workspaceFilesCleanJobScheduleId
      );

      eventBus.publish({
        type: 'workspace.deleted',
        workspace: this.workspace,
      });
    } catch (error) {
      debug(`Error deleting workspace ${this.workspace.id}: ${error}`);
    }
  }
}
