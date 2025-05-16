import { createDebugger, WorkspaceRole } from '@colanode/core';
import { Kysely, Migration, Migrator } from 'kysely';

import {
  WorkspaceDatabaseSchema,
  workspaceDatabaseMigrations,
} from '../../databases/workspace';
import { AccountService } from '../../services/accounts/account-service';
import { NodeService } from '../../services/workspaces/node-service';
import { NodeInteractionService } from '../../services/workspaces/node-interaction-service';
import { NodeReactionService } from '../../services/workspaces/node-reaction-service';
import { FileService } from '../../services/workspaces/file-service';
import { Workspace } from '../../types/workspaces';
import { MutationService } from '../../services/workspaces/mutation-service';
import { UserService } from '../../services/workspaces/user-service';
import { CollaborationService } from '../../services/workspaces/collaboration-service';
import { SyncService } from '../../services/workspaces/sync-service';
import { RadarService } from '../../services/workspaces/radar-service';
import { DocumentService } from '../../services/workspaces/document-service';
import { NodeCountersService } from '../../services/workspaces/node-counters-service';
import { eventBus } from '../../lib/event-bus';

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

  constructor(workspace: Workspace, account: AccountService) {
    debug(`Initializing workspace service ${workspace.id}`);

    this.workspace = workspace;
    this.account = account;

    this.database = account.app.kysely.build<WorkspaceDatabaseSchema>(
      account.app.paths.workspaceDatabase(this.account.id, this.workspace.id)
    );

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
      this.mutations.destroy();
      this.synchronizer.destroy();
      this.files.destroy();
      this.mutations.destroy();
      this.radar.destroy();

      const workspacePath = this.account.app.paths.workspace(
        this.account.id,
        this.workspace.id
      );

      await this.account.app.fs.delete(workspacePath);

      await this.account.database
        .deleteFrom('workspaces')
        .where('id', '=', this.workspace.id)
        .execute();

      eventBus.publish({
        type: 'workspace_deleted',
        workspace: this.workspace,
      });
    } catch (error) {
      debug(`Error deleting workspace ${this.workspace.id}: ${error}`);
    }
  }
}
