import { Collection } from '@tanstack/react-db';

import { Download, LocalNode, Upload, User } from '@colanode/client/types';
import { createAccountsCollection } from '@colanode/ui/data/accounts';
import { createDownloadsCollection } from '@colanode/ui/data/downloads';
import { createMetadataCollection } from '@colanode/ui/data/metadata';
import { createNodesCollection } from '@colanode/ui/data/nodes';
import { createServersCollection } from '@colanode/ui/data/servers';
import { createTabsCollection } from '@colanode/ui/data/tabs';
import { createTempFilesCollection } from '@colanode/ui/data/temp-files';
import { createUploadsCollection } from '@colanode/ui/data/uploads';
import { createUsersCollection } from '@colanode/ui/data/users';
import { createWorkspacesCollection } from '@colanode/ui/data/workspaces';

class WorkspaceDatabase {
  private readonly userId: string;

  public readonly users: Collection<User, string>;
  public readonly downloads: Collection<Download, string>;
  public readonly uploads: Collection<Upload, string>;
  public readonly nodes: Collection<LocalNode, string>;

  constructor(userId: string) {
    this.userId = userId;
    this.users = createUsersCollection(userId);
    this.downloads = createDownloadsCollection(userId);
    this.uploads = createUploadsCollection(userId);
    this.nodes = createNodesCollection(userId);
  }
}

class AppDatabase {
  public readonly servers = createServersCollection();
  public readonly accounts = createAccountsCollection();
  public readonly tabs = createTabsCollection();
  public readonly metadata = createMetadataCollection();
  public readonly workspaces = createWorkspacesCollection();
  public readonly tempFiles = createTempFilesCollection();

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
      this.tempFiles.preload(),
    ]);
  }

  public workspace(userId: string) {
    return this.getWorkspaceDatabase(userId);
  }
}

export const database = new AppDatabase();
