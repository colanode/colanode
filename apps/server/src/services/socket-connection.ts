import { WebSocket } from 'ws';
import {
  Message,
  SynchronizerInput,
  SynchronizerInputMessage,
  UserStatus,
  createDebugger,
} from '@colanode/core';

import { RequestAccount } from '@/types/api';
import { database } from '@/data/database';
import {
  AccountUpdatedEvent,
  CollaborationCreatedEvent,
  CollaborationUpdatedEvent,
  Event,
  UserCreatedEvent,
  UserUpdatedEvent,
  WorkspaceDeletedEvent,
  WorkspaceUpdatedEvent,
} from '@/types/events';
import { ConnectedUser } from '@/types/users';
import { BaseSynchronizer } from '@/synchronizers/base';
import { UserSynchronizer } from '@/synchronizers/users';
import { CollaborationSynchronizer } from '@/synchronizers/collaborations';
import { NodeUpdatesSynchronizer } from '@/synchronizers/node-updates';
import { NodeReactionSynchronizer } from '@/synchronizers/node-reactions';
import { NodeTombstoneSynchronizer } from '@/synchronizers/node-tombstones';
import { NodeInteractionSynchronizer } from '@/synchronizers/node-interactions';
import { DocumentUpdateSynchronizer } from '@/synchronizers/document-updates';

type SocketUser = {
  user: ConnectedUser;
  rootIds: Set<string>;
  synchronizers: Map<string, BaseSynchronizer<SynchronizerInput>>;
};

const debug = createDebugger('server:service:socket-connection');

export class SocketConnection {
  private readonly account: RequestAccount;
  private readonly socket: WebSocket;

  private readonly users: Map<string, SocketUser> = new Map();
  private readonly pendingUsers: Map<string, Promise<SocketUser | null>> =
    new Map();

  constructor(account: RequestAccount, socket: WebSocket) {
    debug(`New connection, account:${account.id}, device:${account.deviceId}`);

    this.account = account;
    this.socket = socket;

    this.socket.on('message', (data) => {
      const message = JSON.parse(data.toString()) as Message;
      this.handleMessage(message);
    });
  }

  public getDeviceId() {
    return this.account.deviceId;
  }

  public getAccountId() {
    return this.account.id;
  }

  public sendMessage(message: Message) {
    this.socket.send(JSON.stringify(message));
  }

  public close() {
    this.socket.close();
  }

  private async handleMessage(message: Message) {
    debug(
      `Socket message, account:${this.account.id}, device:${this.account.deviceId}, type:${message.type}`
    );

    if (message.type === 'synchronizer_input') {
      this.handleSynchronizerInput(message);
    }
  }

  public async handleEvent(event: Event) {
    if (event.type === 'account_updated') {
      this.handleAccountUpdatedEvent(event);
    } else if (event.type === 'workspace_updated') {
      this.handleWorkspaceUpdatedEvent(event);
    } else if (event.type === 'workspace_deleted') {
      this.handleWorkspaceDeletedEvent(event);
    } else if (event.type === 'collaboration_created') {
      this.handleCollaborationCreatedEvent(event);
    } else if (event.type === 'collaboration_updated') {
      this.handleCollaborationUpdatedEvent(event);
    } else if (event.type === 'user_created') {
      this.handleUserCreatedEvent(event);
    } else if (event.type === 'user_updated') {
      this.handleUserUpdatedEvent(event);
    }

    for (const user of this.users.values()) {
      for (const synchronizer of user.synchronizers.values()) {
        const output = await synchronizer.fetchDataFromEvent(event);
        if (output) {
          user.synchronizers.delete(synchronizer.id);
          this.sendMessage(output);
        }
      }
    }
  }

  private async handleSynchronizerInput(message: SynchronizerInputMessage) {
    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    const synchronizer = this.buildSynchronizer(message, user);
    if (synchronizer === null) {
      return;
    }

    const output = await synchronizer.fetchData();
    if (output === null) {
      user.synchronizers.set(synchronizer.id, synchronizer);
      return;
    }

    this.sendMessage(output);
  }

  private buildSynchronizer(
    message: SynchronizerInputMessage,
    user: SocketUser
  ): BaseSynchronizer<SynchronizerInput> | null {
    const cursor = message.cursor;
    if (message.input.type === 'users') {
      return new UserSynchronizer(message.id, user.user, message.input, cursor);
    } else if (message.input.type === 'collaborations') {
      return new CollaborationSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'nodes_updates') {
      if (!user.rootIds.has(message.input.rootId)) {
        return null;
      }

      return new NodeUpdatesSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'node_reactions') {
      return new NodeReactionSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'node_interactions') {
      return new NodeInteractionSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'node_tombstones') {
      if (!user.rootIds.has(message.input.rootId)) {
        return null;
      }

      return new NodeTombstoneSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    } else if (message.input.type === 'document_updates') {
      if (!user.rootIds.has(message.input.rootId)) {
        return null;
      }

      return new DocumentUpdateSynchronizer(
        message.id,
        user.user,
        message.input,
        cursor
      );
    }

    return null;
  }

  private async getOrCreateUser(userId: string): Promise<SocketUser | null> {
    const existingUser = this.users.get(userId);
    if (existingUser) {
      return existingUser;
    }

    const pendingUser = this.pendingUsers.get(userId);
    if (pendingUser) {
      return pendingUser;
    }

    const userPromise = this.fetchAndCreateUser(userId);
    this.pendingUsers.set(userId, userPromise);

    try {
      const user = await userPromise;
      return user;
    } finally {
      this.pendingUsers.delete(userId);
    }
  }

  private async fetchAndCreateUser(userId: string): Promise<SocketUser | null> {
    const user = await database
      .selectFrom('users')
      .where('id', '=', userId)
      .where('status', '=', UserStatus.Active)
      .where('role', '!=', 'none')
      .selectAll()
      .executeTakeFirst();

    if (
      !user ||
      user.status !== UserStatus.Active ||
      user.account_id !== this.account.id
    ) {
      return null;
    }

    const collaborations = await database
      .selectFrom('collaborations')
      .selectAll()
      .where('collaborator_id', '=', userId)
      .execute();

    const addedSocketUser = this.users.get(userId);
    if (addedSocketUser) {
      return addedSocketUser;
    }

    // Create and store the new SocketUser
    const connectedUser: ConnectedUser = {
      userId: user.id,
      workspaceId: user.workspace_id,
      accountId: this.account.id,
      deviceId: this.account.deviceId,
    };

    const rootIds = new Set<string>();
    for (const collaboration of collaborations) {
      if (collaboration.deleted_at) {
        continue;
      }

      rootIds.add(collaboration.node_id);
    }

    const socketUser: SocketUser = {
      user: connectedUser,
      rootIds,
      synchronizers: new Map(),
    };

    this.users.set(userId, socketUser);
    return socketUser;
  }

  private handleAccountUpdatedEvent(event: AccountUpdatedEvent) {
    if (event.accountId !== this.account.id) {
      return;
    }

    this.sendMessage({
      type: 'account_updated',
      accountId: this.account.id,
    });
  }

  private handleWorkspaceUpdatedEvent(event: WorkspaceUpdatedEvent) {
    const socketUsers = Array.from(this.users.values()).filter(
      (user) => user.user.workspaceId === event.workspaceId
    );

    if (socketUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_updated',
      workspaceId: event.workspaceId,
    });
  }

  private handleWorkspaceDeletedEvent(event: WorkspaceDeletedEvent) {
    const socketUsers = Array.from(this.users.values()).filter(
      (user) => user.user.workspaceId === event.workspaceId
    );

    if (socketUsers.length === 0) {
      return;
    }

    this.sendMessage({
      type: 'workspace_deleted',
      accountId: this.account.id,
    });
  }

  private handleCollaborationCreatedEvent(event: CollaborationCreatedEvent) {
    const user = this.users.get(event.collaboratorId);
    if (!user) {
      return;
    }

    user.rootIds.add(event.nodeId);
  }

  private async handleCollaborationUpdatedEvent(
    event: CollaborationUpdatedEvent
  ) {
    const user = this.users.get(event.collaboratorId);
    if (!user) {
      return;
    }

    const collaboration = await database
      .selectFrom('collaborations')
      .selectAll()
      .where('collaborator_id', '=', event.collaboratorId)
      .where('node_id', '=', event.nodeId)
      .executeTakeFirst();

    if (!collaboration || collaboration.deleted_at) {
      user.rootIds.delete(event.nodeId);
    } else {
      user.rootIds.add(event.nodeId);
    }
  }

  private handleUserCreatedEvent(event: UserCreatedEvent) {
    if (event.accountId !== this.account.id) {
      return;
    }

    this.sendMessage({
      type: 'user_created',
      accountId: event.accountId,
      workspaceId: event.workspaceId,
      userId: event.userId,
    });
  }

  private handleUserUpdatedEvent(event: UserUpdatedEvent) {
    if (event.accountId !== this.account.id) {
      return;
    }

    this.sendMessage({
      type: 'user_updated',
      accountId: event.accountId,
      userId: event.userId,
    });
  }
}
