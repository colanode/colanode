import { createAccountsCollection } from '@colanode/ui/data/accounts';
import { createMetadataCollection } from '@colanode/ui/data/metadata';
import { createServersCollection } from '@colanode/ui/data/servers';
import { createTabsCollection } from '@colanode/ui/data/tabs';
import { createWorkspacesCollection } from '@colanode/ui/data/workspaces';

class WorkspaceDatabase {
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}

class AppDatabase {
  public readonly servers = createServersCollection();
  public readonly accounts = createAccountsCollection();
  public readonly tabs = createTabsCollection();
  public readonly metadata = createMetadataCollection();
  public readonly workspaces = createWorkspacesCollection();

  private readonly workspaceDatabases: Map<string, WorkspaceDatabase> =
    new Map();

  private getWorkspaceDatabase(userId: string) {
    if (!this.workspaceDatabases.has(userId)) {
      if (!this.workspaces.has(userId)) {
        throw new Error(`Workspace not found`);
      }

      this.workspaceDatabases.set(userId, new WorkspaceDatabase(userId));
    }

    return this.workspaceDatabases.get(userId)!;
  }

  public async preload(): Promise<void> {
    await Promise.all([
      this.servers.preload(),
      this.accounts.preload(),
      this.metadata.preload(),
      this.tabs.preload(),
      this.workspaces.preload(),
    ]);
  }
}

export const database = new AppDatabase();
