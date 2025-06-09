import { eventBus } from '@colanode/client/lib/event-bus';
import { Synchronizer } from '@colanode/client/services/workspaces/synchronizer';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { Event } from '@colanode/client/types/events';
import {
  createDebugger,
  SyncCollaborationsInput,
  SyncUsersInput,
  SyncNodesUpdatesInput,
  SyncNodeInteractionsInput,
  SyncNodeReactionsInput,
  SyncNodeTombstonesInput,
  SyncNodeInteractionData,
  SyncNodeReactionData,
  SyncNodeTombstoneData,
  SyncNodeUpdateData,
  SyncUserData,
  SyncCollaborationData,
  SyncDocumentUpdatesInput,
  SyncDocumentUpdateData,
} from '@colanode/core';

interface RootSynchronizers {
  nodeUpdates: Synchronizer<SyncNodesUpdatesInput>;
  nodeInteractions: Synchronizer<SyncNodeInteractionsInput>;
  nodeReactions: Synchronizer<SyncNodeReactionsInput>;
  nodeTombstones: Synchronizer<SyncNodeTombstonesInput>;
  documentUpdates: Synchronizer<SyncDocumentUpdatesInput>;
}

type SyncHandlers = {
  users: (data: SyncUserData) => Promise<void>;
  collaborations: (data: SyncCollaborationData) => Promise<void>;
  nodeUpdates: (data: SyncNodeUpdateData) => Promise<void>;
  nodeInteractions: (data: SyncNodeInteractionData) => Promise<void>;
  nodeReactions: (data: SyncNodeReactionData) => Promise<void>;
  nodeTombstones: (data: SyncNodeTombstoneData) => Promise<void>;
  documentUpdates: (data: SyncDocumentUpdateData) => Promise<void>;
};

const debug = createDebugger('desktop:service:sync');

export class SyncService {
  private readonly workspace: WorkspaceService;

  private readonly rootSynchronizers: Map<string, RootSynchronizers> =
    new Map();

  private readonly syncHandlers: SyncHandlers;

  private userSynchronizer: Synchronizer<SyncUsersInput> | undefined;
  private collaborationSynchronizer:
    | Synchronizer<SyncCollaborationsInput>
    | undefined;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
    this.syncHandlers = {
      users: this.workspace.users.syncServerUser.bind(this.workspace.users),
      collaborations:
        this.workspace.collaborations.syncServerCollaboration.bind(
          this.workspace.collaborations
        ),
      nodeUpdates: this.workspace.nodes.syncServerNodeUpdate.bind(
        this.workspace.nodes
      ),
      nodeInteractions:
        this.workspace.nodeInteractions.syncServerNodeInteraction.bind(
          this.workspace.nodes
        ),
      nodeReactions: this.workspace.nodeReactions.syncServerNodeReaction.bind(
        this.workspace.nodes
      ),
      nodeTombstones: this.workspace.nodes.syncServerNodeDelete.bind(
        this.workspace.nodes
      ),
      documentUpdates: this.workspace.documents.syncServerDocumentUpdate.bind(
        this.workspace.documents
      ),
    };
    eventBus.subscribe(this.handleEvent.bind(this));
  }

  private handleEvent(event: Event): void {
    if (
      event.type === 'collaboration.created' &&
      event.accountId === this.workspace.accountId &&
      event.workspaceId === this.workspace.id
    ) {
      this.initRootSynchronizers(event.nodeId);
    } else if (
      event.type === 'collaboration.deleted' &&
      event.accountId === this.workspace.accountId &&
      event.workspaceId === this.workspace.id
    ) {
      this.removeRootSynchronizers(event.nodeId);
    }
  }

  public async init() {
    debug(`Initializing sync service for workspace ${this.workspace.id}`);

    if (!this.userSynchronizer) {
      this.userSynchronizer = new Synchronizer(
        this.workspace,
        { type: 'users' },
        'users',
        this.syncHandlers.users
      );

      await this.userSynchronizer.init();
    }

    if (!this.collaborationSynchronizer) {
      this.collaborationSynchronizer = new Synchronizer(
        this.workspace,
        { type: 'collaborations' },
        'collaborations',
        this.syncHandlers.collaborations
      );

      await this.collaborationSynchronizer.init();
    }

    const collaborations =
      this.workspace.collaborations.getActiveCollaborations();

    for (const collaboration of collaborations) {
      await this.initRootSynchronizers(collaboration.node_id);
    }
  }

  public destroy(): void {
    this.userSynchronizer?.destroy();
    this.collaborationSynchronizer?.destroy();

    for (const rootSynchronizers of this.rootSynchronizers.values()) {
      this.destroyRootSynchronizers(rootSynchronizers);
    }
  }

  private destroyRootSynchronizers(rootSynchronizers: RootSynchronizers): void {
    rootSynchronizers.nodeUpdates.destroy();
    rootSynchronizers.nodeInteractions.destroy();
    rootSynchronizers.nodeReactions.destroy();
    rootSynchronizers.nodeTombstones.destroy();
    rootSynchronizers.documentUpdates.destroy();
  }

  private async initRootSynchronizers(rootId: string): Promise<void> {
    if (this.rootSynchronizers.has(rootId)) {
      return;
    }

    debug(
      `Initializing root synchronizers for root ${rootId} in workspace ${this.workspace.id}`
    );

    const rootSynchronizers = {
      nodeUpdates: new Synchronizer(
        this.workspace,
        { type: 'nodes.updates', rootId },
        `${rootId}_nodes_updates`,
        this.syncHandlers.nodeUpdates
      ),
      nodeInteractions: new Synchronizer(
        this.workspace,
        { type: 'node.interactions', rootId },
        `${rootId}_node_interactions`,
        this.syncHandlers.nodeInteractions
      ),
      nodeReactions: new Synchronizer(
        this.workspace,
        { type: 'node.reactions', rootId },
        `${rootId}_node_reactions`,
        this.syncHandlers.nodeReactions
      ),
      nodeTombstones: new Synchronizer(
        this.workspace,
        { type: 'node.tombstones', rootId },
        `${rootId}_node_tombstones`,
        this.syncHandlers.nodeTombstones
      ),
      documentUpdates: new Synchronizer(
        this.workspace,
        { type: 'document.updates', rootId },
        `${rootId}_document_updates`,
        this.syncHandlers.documentUpdates
      ),
    };

    this.rootSynchronizers.set(rootId, rootSynchronizers);
    await Promise.all(
      Object.values(rootSynchronizers).map((synchronizer) =>
        synchronizer.init()
      )
    );
  }

  private removeRootSynchronizers(rootId: string): void {
    const rootSynchronizers = this.rootSynchronizers.get(rootId);
    if (!rootSynchronizers) {
      return;
    }

    this.destroyRootSynchronizers(rootSynchronizers);
    this.rootSynchronizers.delete(rootId);
  }
}
