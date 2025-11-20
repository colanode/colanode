import { Collection, createLiveQueryCollection, eq } from '@tanstack/react-db';

import {
  Download,
  LocalChatNode,
  LocalDatabaseNode,
  LocalDatabaseViewNode,
  LocalNode,
  LocalRecordNode,
  LocalSpaceNode,
  Upload,
  User,
} from '@colanode/client/types';
import { createAccountsCollection } from '@colanode/ui/collections/accounts';
import { createDownloadsCollection } from '@colanode/ui/collections/downloads';
import { createMetadataCollection } from '@colanode/ui/collections/metadata';
import { createNodesCollection } from '@colanode/ui/collections/nodes';
import { createServersCollection } from '@colanode/ui/collections/servers';
import { createTabsCollection } from '@colanode/ui/collections/tabs';
import { createTempFilesCollection } from '@colanode/ui/collections/temp-files';
import { createUploadsCollection } from '@colanode/ui/collections/uploads';
import { createUsersCollection } from '@colanode/ui/collections/users';
import { createWorkspacesCollection } from '@colanode/ui/collections/workspaces';

class WorkspaceCollections {
  private readonly userId: string;

  public readonly users: Collection<User, string>;
  public readonly downloads: Collection<Download, string>;
  public readonly uploads: Collection<Upload, string>;
  public readonly nodes: Collection<LocalNode, string>;
  public readonly databases: Collection<LocalDatabaseNode>;
  public readonly views: Collection<LocalDatabaseViewNode>;
  public readonly records: Collection<LocalRecordNode>;
  public readonly chats: Collection<LocalChatNode>;
  public readonly spaces: Collection<LocalSpaceNode>;

  constructor(userId: string) {
    this.userId = userId;
    this.users = createUsersCollection(userId);
    this.downloads = createDownloadsCollection(userId);
    this.uploads = createUploadsCollection(userId);
    this.nodes = createNodesCollection(userId);

    this.databases = createLiveQueryCollection((q) =>
      q
        .from({ nodes: this.nodes })
        .where(({ nodes }) => eq(nodes.type, 'database'))
    );
    this.views = createLiveQueryCollection((q) =>
      q
        .from({ nodes: this.nodes })
        .where(({ nodes }) => eq(nodes.type, 'database_view'))
    );
    this.chats = createLiveQueryCollection((q) =>
      q.from({ nodes: this.nodes }).where(({ nodes }) => eq(nodes.type, 'chat'))
    );
    this.spaces = createLiveQueryCollection((q) =>
      q
        .from({ nodes: this.nodes })
        .where(({ nodes }) => eq(nodes.type, 'space'))
    );
    this.records = createLiveQueryCollection((q) =>
      q
        .from({ nodes: this.nodes })
        .where(({ nodes }) => eq(nodes.type, 'record'))
    );
  }
}

class AppCollections {
  public readonly servers = createServersCollection();
  public readonly accounts = createAccountsCollection();
  public readonly tabs = createTabsCollection();
  public readonly metadata = createMetadataCollection();
  public readonly workspaces = createWorkspacesCollection();
  public readonly tempFiles = createTempFilesCollection();

  private readonly workspaceCollections: Map<string, WorkspaceCollections> =
    new Map();

  private getWorkspaceCollections(userId: string) {
    if (!this.workspaceCollections.has(userId)) {
      if (!this.workspaces.has(userId)) {
        throw new Error(`Workspace not found`);
      }

      this.workspaceCollections.set(userId, new WorkspaceCollections(userId));
    }

    return this.workspaceCollections.get(userId)!;
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
    return this.getWorkspaceCollections(userId);
  }
}

export const collections = new AppCollections();
