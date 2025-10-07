import { createAccountMetadataCollection } from '@colanode/ui/data/account-metadata';
import { createAccountsCollection } from '@colanode/ui/data/accounts';
import { createAppMetadataCollection } from '@colanode/ui/data/app-metadata';
import { createServersCollection } from '@colanode/ui/data/servers';
import { createTabsCollection } from '@colanode/ui/data/tabs';
import { createWorkspaceMetadataCollection } from '@colanode/ui/data/workspace-metadata';
import { createWorkspacesCollection } from '@colanode/ui/data/workspaces';
import { queryClient } from '@colanode/ui/lib/query';

class AccountDatabase {
  private readonly accountId: string;
  public readonly metadata: ReturnType<typeof createAccountMetadataCollection>;
  public readonly workspaces: ReturnType<typeof createWorkspacesCollection>;

  private readonly workspaceDatabases: Map<string, WorkspaceDatabase> =
    new Map();

  constructor(accountId: string) {
    this.accountId = accountId;
    this.metadata = createAccountMetadataCollection(
      queryClient,
      this.accountId
    );
    this.workspaces = createWorkspacesCollection(queryClient, this.accountId);
  }

  public workspaceMetadata(workspaceId: string) {
    const workspaceDatabase = this.getWorkspaceDatabase(workspaceId);
    return workspaceDatabase.metadata;
  }

  private getWorkspaceDatabase(workspaceId: string) {
    if (!this.workspaceDatabases.has(workspaceId)) {
      if (!this.workspaces.has(workspaceId)) {
        throw new Error(`Workspace not found`);
      }

      this.workspaceDatabases.set(
        workspaceId,
        new WorkspaceDatabase(this.accountId, workspaceId)
      );
    }

    return this.workspaceDatabases.get(workspaceId)!;
  }

  public async preload(): Promise<void> {
    await this.metadata.preload();
    await this.workspaces.preload();

    const workspaceIds = this.workspaces.keys();
    for (const workspaceId of workspaceIds) {
      const workspaceDatabase = new WorkspaceDatabase(
        this.accountId,
        workspaceId
      );
      this.workspaceDatabases.set(workspaceId, workspaceDatabase);

      await workspaceDatabase.preload();
    }
  }
}

class WorkspaceDatabase {
  private readonly accountId: string;
  private readonly workspaceId: string;

  public readonly metadata: ReturnType<
    typeof createWorkspaceMetadataCollection
  >;

  constructor(accountId: string, workspaceId: string) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.metadata = createWorkspaceMetadataCollection(
      queryClient,
      this.accountId,
      this.workspaceId
    );
  }

  public async preload(): Promise<void> {
    await this.metadata.preload();
  }
}

class AppDatabase {
  public readonly servers = createServersCollection(queryClient);
  public readonly accounts = createAccountsCollection(queryClient);
  public readonly tabs = createTabsCollection(queryClient);
  public readonly metadata = createAppMetadataCollection(queryClient);

  private readonly accountDatabases: Map<string, AccountDatabase> = new Map();

  public accountMetadata(accountId: string) {
    const accountDatabase = this.getAccountDatabase(accountId);
    return accountDatabase.metadata;
  }

  public accountWorkspaces(accountId: string) {
    const accountDatabase = this.getAccountDatabase(accountId);
    return accountDatabase.workspaces;
  }

  public workspaceMetadata(accountId: string, workspaceId: string) {
    const accountDatabase = this.getAccountDatabase(accountId);
    return accountDatabase.workspaceMetadata(workspaceId);
  }

  private getAccountDatabase(accountId: string) {
    if (!this.accountDatabases.has(accountId)) {
      if (!this.accounts.has(accountId)) {
        throw new Error(`Account not found`);
      }

      this.accountDatabases.set(accountId, new AccountDatabase(accountId));
    }

    return this.accountDatabases.get(accountId)!;
  }

  public async preload(): Promise<void> {
    await Promise.all([
      this.servers.preload(),
      this.accounts.preload(),
      this.metadata.preload(),
      this.tabs.preload(),
    ]);

    const accountIds = this.accounts.keys();
    for (const accountId of accountIds) {
      const accountDatabase = new AccountDatabase(accountId);
      this.accountDatabases.set(accountId, accountDatabase);

      await accountDatabase.preload();
    }
  }
}

export const database = new AppDatabase();
