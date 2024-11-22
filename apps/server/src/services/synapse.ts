import { database } from '@/data/database';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/tokens';
import { CHANNEL_NAMES } from '@/data/redis';
import { redis } from '@/data/redis';
import {
  SynapseMessage,
  SynapseNodeChangeMessage,
  SynapseUserNodeChangeMessage,
} from '@/types/synapse';
import { getIdType, IdType } from '@colanode/core';
import { Message } from '@colanode/core';
import { logService } from '@/services/log';
import { encodeState } from '@colanode/crdt';

interface SynapseConnection {
  accountId: string;
  deviceId: string;
  workspaceUsers: {
    workspaceId: string;
    userId: string;
  }[];
  pendingSyncs: Set<string>;
  socket: WebSocket;
  pendingSyncTimeout: NodeJS.Timeout | null;
}

class SynapseService {
  private readonly logger = logService.createLogger('synapse-service');
  private readonly connections: Map<string, SynapseConnection> = new Map();

  public async init(server: Server) {
    this.logger.info('Initializing synapse service');

    const wss = new WebSocketServer({
      server,
      path: '/v1/synapse',
      verifyClient: async (info, callback) => {
        const req = info.req;
        const token = req.headers['authorization'];

        if (!token) {
          return callback(false, 401, 'Unauthorized');
        }

        callback(true);
      },
    });

    wss.on('connection', async (socket, req) => {
      const token = req.headers['authorization'];
      if (!token) {
        socket.close();
        return;
      }

      const result = await verifyToken(token);
      if (!result.authenticated) {
        socket.close();
        return;
      }

      const account = result.account;
      this.logger.info(`New synapse connection from ${account.id}`);

      socket.on('close', () => {
        const connection = this.connections.get(account.deviceId);
        if (connection) {
          if (connection.pendingSyncTimeout) {
            clearTimeout(connection.pendingSyncTimeout);
          }

          this.connections.delete(account.deviceId);
        }
      });

      const connection: SynapseConnection = {
        accountId: account.id,
        deviceId: account.deviceId,
        workspaceUsers: [],
        pendingSyncs: new Set(),
        pendingSyncTimeout: null,
        socket,
      };

      socket.on('message', (message) => {
        this.handleSocketMessage(connection, JSON.parse(message.toString()));
      });

      this.connections.set(account.deviceId, connection);
      this.fetchWorkspaceUsers(connection).then(() => {
        this.sendPendingChangesDebounced(connection);
      });
    });

    const subscriber = redis.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(CHANNEL_NAMES.SYNAPSE, (message) =>
      this.handleSynapseMessage(message.toString())
    );
  }

  private sendSocketMessage(connection: SynapseConnection, message: Message) {
    connection.socket.send(JSON.stringify(message));
  }

  private async handleSocketMessage(
    connection: SynapseConnection,
    message: Message
  ) {
    this.logger.trace(message, `Socket message from ${connection.deviceId}`);

    if (message.type === 'local_node_sync') {
      await database
        .insertInto('device_nodes')
        .values({
          node_id: message.nodeId,
          user_id: message.userId,
          device_id: connection.deviceId,
          node_version_id: message.versionId,
          user_node_version_id: null,
          user_node_synced_at: null,
          workspace_id: message.workspaceId,
          node_synced_at: new Date(),
        })
        .onConflict((cb) =>
          cb.columns(['node_id', 'user_id', 'device_id']).doUpdateSet({
            workspace_id: message.workspaceId,
            node_version_id: message.versionId,
            node_synced_at: new Date(),
          })
        )
        .execute();
    } else if (message.type === 'local_user_node_sync') {
      await database
        .insertInto('device_nodes')
        .values({
          node_id: message.nodeId,
          user_id: message.userId,
          device_id: connection.deviceId,
          node_version_id: null,
          user_node_version_id: message.versionId,
          user_node_synced_at: new Date(),
          workspace_id: message.workspaceId,
          node_synced_at: new Date(),
        })
        .onConflict((cb) =>
          cb.columns(['node_id', 'user_id', 'device_id']).doUpdateSet({
            workspace_id: message.workspaceId,
            user_node_version_id: message.versionId,
            user_node_synced_at: new Date(),
          })
        )
        .execute();
    } else if (message.type === 'local_node_delete') {
      await database
        .deleteFrom('device_nodes')
        .where('device_id', '=', connection.deviceId)
        .where('node_id', '=', message.nodeId)
        .execute();

      const userId = connection.workspaceUsers.find(
        (wu) => wu.workspaceId === message.workspaceId
      )?.userId;

      if (userId) {
        const userDevices = await database
          .selectFrom('devices')
          .select('id')
          .where(
            'account_id',
            'in',
            database
              .selectFrom('workspace_users')
              .select('account_id')
              .where('id', '=', userId)
          )
          .execute();

        const deviceIds = userDevices.map((device) => device.id);
        if (deviceIds.length > 0) {
          const deviceNodes = await database
            .selectFrom('device_nodes')
            .select('node_id')
            .where('device_id', 'in', deviceIds)
            .where('node_id', '=', message.nodeId)
            .execute();

          if (deviceNodes.length === 0) {
            await database
              .deleteFrom('user_nodes')
              .where('node_id', '=', message.nodeId)
              .where('user_id', '=', userId)
              .execute();
          }
        }
      }
    }

    this.sendPendingChangesDebounced(connection);
  }

  public async sendSynapseMessage(message: SynapseMessage) {
    await redis.publish(CHANNEL_NAMES.SYNAPSE, JSON.stringify(message));
  }

  private async handleSynapseMessage(message: string) {
    const data: SynapseMessage = JSON.parse(message);
    this.logger.trace(data, 'Synapse message');

    if (
      data.type === 'node_create' ||
      data.type === 'node_update' ||
      data.type === 'node_delete'
    ) {
      this.handleNodeChangeMessage(data);
    } else if (data.type === 'user_node_update') {
      this.handleUserNodeUpdateMessage(data);
    }
  }

  private async handleNodeChangeMessage(data: SynapseNodeChangeMessage) {
    const idType = getIdType(data.nodeId);
    if (idType === IdType.User) {
      await this.addNewWorkspaceUser(data.nodeId, data.workspaceId);
    }

    await this.broadcastNodeChange(data);
  }

  private async broadcastNodeChange(data: SynapseNodeChangeMessage) {
    const userDevices = this.getWorkspaceUserDevices(data.workspaceId);
    const userIds = Array.from(userDevices.keys());
    if (userIds.length === 0) {
      return;
    }

    this.logger.trace(
      userIds,
      `Broadcasting node change for ${data.nodeId} to ${userIds.length} users`
    );

    const userNodes = await database
      .selectFrom('user_nodes')
      .selectAll()
      .where((eb) =>
        eb.and([eb('user_id', 'in', userIds), eb('node_id', '=', data.nodeId)])
      )
      .execute();

    if (userNodes.length === 0) {
      return;
    }

    if (data.type === 'node_delete') {
      for (const userNode of userNodes) {
        const deviceIds = userDevices.get(userNode.user_id) ?? [];
        for (const deviceId of deviceIds) {
          const socketConnection = this.connections.get(deviceId);
          if (socketConnection === undefined) {
            continue;
          }

          this.sendSocketMessage(socketConnection, {
            type: 'server_node_delete',
            id: data.nodeId,
            workspaceId: data.workspaceId,
          });
        }
      }

      return;
    }

    const node = await database
      .selectFrom('nodes')
      .select([
        'id',
        'state',
        'created_at',
        'created_by',
        'updated_at',
        'updated_by',
        'server_created_at',
        'server_updated_at',
        'version_id',
      ])
      .where('id', '=', data.nodeId)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    for (const userNode of userNodes) {
      const deviceIds = userDevices.get(userNode.user_id) ?? [];
      if (deviceIds.length === 0) {
        continue;
      }

      for (const deviceId of deviceIds) {
        const socketConnection = this.connections.get(deviceId);
        if (socketConnection === undefined) {
          continue;
        }

        if (userNode.access_removed_at !== null) {
          this.sendSocketMessage(socketConnection, {
            type: 'server_node_delete',
            id: data.nodeId,
            workspaceId: data.workspaceId,
          });
        } else {
          this.sendSocketMessage(socketConnection, {
            type: 'server_node_sync',
            node: {
              id: node.id,
              workspaceId: data.workspaceId,
              state: encodeState(node.state),
              createdAt: node.created_at.toISOString(),
              createdBy: node.created_by,
              updatedAt: node.updated_at?.toISOString() ?? null,
              updatedBy: node.updated_by ?? null,
              serverCreatedAt: node.server_created_at.toISOString(),
              serverUpdatedAt: node.server_updated_at?.toISOString() ?? null,
              versionId: node.version_id,
            },
          });
        }
      }
    }
  }

  private async handleUserNodeUpdateMessage(
    data: SynapseUserNodeChangeMessage
  ) {
    const userDevices = this.getWorkspaceUserDevices(data.workspaceId);
    if (!userDevices.has(data.userId)) {
      return;
    }

    const userNode = await database
      .selectFrom('user_nodes')
      .selectAll()
      .where('user_id', '=', data.userId)
      .where('node_id', '=', data.nodeId)
      .executeTakeFirst();

    if (!userNode) {
      return;
    }

    const deviceIds = userDevices.get(data.userId) ?? [];
    for (const deviceId of deviceIds) {
      const socketConnection = this.connections.get(deviceId);
      if (socketConnection === undefined) {
        continue;
      }

      this.sendSocketMessage(socketConnection, {
        type: 'server_user_node_sync',
        userNode: {
          userId: data.userId,
          nodeId: data.nodeId,
          lastSeenVersionId: userNode.last_seen_version_id,
          workspaceId: data.workspaceId,
          versionId: userNode.version_id,
          lastSeenAt: userNode.last_seen_at?.toISOString() ?? null,
          createdAt: userNode.created_at.toISOString(),
          updatedAt: userNode.updated_at?.toISOString() ?? null,
          mentionsCount: userNode.mentions_count,
        },
      });
    }
  }

  private sendPendingChangesDebounced(connection: SynapseConnection) {
    if (connection.pendingSyncTimeout) {
      clearTimeout(connection.pendingSyncTimeout);
    }

    connection.pendingSyncTimeout = setTimeout(async () => {
      await this.sendPendingChanges(connection);
    }, 500);
  }

  private async sendPendingChanges(connection: SynapseConnection) {
    const userIds = connection.workspaceUsers.map(
      (workspaceUser) => workspaceUser.userId
    );

    if (userIds.length === 0) {
      return;
    }

    this.logger.trace(
      userIds,
      `Sending pending changes for ${connection.deviceId} with ${userIds.length} users`
    );

    const unsyncedNodes = await database
      .selectFrom('user_nodes as nus')
      .leftJoin('nodes as n', 'n.id', 'nus.node_id')
      .leftJoin('device_nodes as nds', (join) =>
        join
          .onRef('nds.node_id', '=', 'nus.node_id')
          .on('nds.device_id', '=', connection.deviceId)
      )
      .select([
        'n.id',
        'n.state',
        'n.created_at',
        'n.created_by',
        'n.updated_at',
        'n.updated_by',
        'n.server_created_at',
        'n.server_updated_at',
        'nus.access_removed_at',
        'n.version_id as node_version_id',
        'nus.node_id',
        'nus.user_id',
        'nus.workspace_id',
        'nus.last_seen_version_id',
        'nus.last_seen_at',
        'nus.mentions_count',
        'nus.created_at',
        'nus.updated_at',
        'nus.version_id as user_node_version_id',
        'nds.node_version_id as device_node_version_id',
        'nds.user_node_version_id as device_user_node_version_id',
      ])
      .where((eb) =>
        eb.and([
          eb('nus.user_id', 'in', userIds),
          eb.or([
            eb('n.id', 'is', null),
            eb('nus.access_removed_at', 'is not', null),
            eb('nds.node_version_id', 'is', null),
            eb('nds.node_version_id', '!=', eb.ref('n.version_id')),
            eb('nds.user_node_version_id', 'is', null),
            eb('nds.user_node_version_id', '!=', eb.ref('nus.version_id')),
          ]),
        ])
      )
      .orderBy('n.id', 'asc')
      .limit(100)
      .execute();

    if (unsyncedNodes.length === 0) {
      return;
    }

    for (const row of unsyncedNodes) {
      connection.pendingSyncs.add(row.node_id);
      if (row.id === null) {
        this.sendSocketMessage(connection, {
          type: 'server_node_delete',
          id: row.node_id,
          workspaceId: row.workspace_id,
        });
        continue;
      }

      if (row.node_version_id !== row.device_node_version_id) {
        this.sendSocketMessage(connection, {
          type: 'server_node_sync',
          node: {
            id: row.id,
            workspaceId: row.workspace_id,
            state: encodeState(row.state!),
            createdAt: row.created_at!.toISOString(),
            createdBy: row.created_by!,
            updatedAt: row.updated_at?.toISOString() ?? null,
            updatedBy: row.updated_by ?? null,
            serverCreatedAt: row.server_created_at!.toISOString(),
            serverUpdatedAt: row.server_updated_at?.toISOString() ?? null,
            versionId: row.node_version_id!,
          },
        });
      }

      if (row.user_node_version_id !== row.device_user_node_version_id) {
        this.sendSocketMessage(connection, {
          type: 'server_user_node_sync',
          userNode: {
            nodeId: row.node_id,
            userId: row.user_id,
            workspaceId: row.workspace_id,
            versionId: row.user_node_version_id!,
            lastSeenAt: row.last_seen_at?.toISOString() ?? null,
            lastSeenVersionId: row.last_seen_version_id ?? null,
            mentionsCount: row.mentions_count,
            createdAt: row.created_at!.toISOString(),
            updatedAt: row.updated_at?.toISOString() ?? null,
          },
        });
      }
    }
  }

  private async addNewWorkspaceUser(userId: string, workspaceId: string) {
    this.logger.trace(
      userId,
      `Adding new workspace user ${userId} to ${workspaceId}`
    );

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!workspaceUser) {
      return;
    }

    const devices = await database
      .selectFrom('devices')
      .selectAll()
      .where('account_id', '=', workspaceUser.account_id)
      .execute();

    for (const device of devices) {
      const connection = this.connections.get(device.id);
      if (!connection) {
        continue;
      }

      if (connection.workspaceUsers.find((wu) => wu.userId === userId)) {
        continue;
      }

      connection.workspaceUsers.push({
        workspaceId,
        userId,
      });
    }
  }

  private async fetchWorkspaceUsers(
    connection: SynapseConnection
  ): Promise<void> {
    const workspaceUsers = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('account_id', '=', connection.accountId)
      .execute();

    for (const workspaceUser of workspaceUsers) {
      if (
        !connection.workspaceUsers.find((wu) => wu.userId === workspaceUser.id)
      ) {
        connection.workspaceUsers.push({
          workspaceId: workspaceUser.workspace_id,
          userId: workspaceUser.id,
        });
      }
    }
  }

  private getWorkspaceUserDevices(workspaceId: string): Map<string, string[]> {
    const userDevices = new Map<string, string[]>();
    for (const connection of this.connections.values()) {
      const workspaceUsers = connection.workspaceUsers;
      for (const workspaceUser of workspaceUsers) {
        if (workspaceUser.workspaceId !== workspaceId) {
          continue;
        }

        const userIds = userDevices.get(workspaceUser.userId) ?? [];
        userIds.push(connection.deviceId);
        userDevices.set(workspaceUser.userId, userIds);
      }
    }

    return userDevices;
  }
}

export const synapse = new SynapseService();
