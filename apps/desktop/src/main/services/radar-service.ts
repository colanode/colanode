import { getIdType, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';
import { Event } from '@/shared/types/events';
import { WorkspaceRadarData } from '@/shared/types/radars';

class RadarService {
  private readonly workspaceStates: Map<string, WorkspaceRadarData> = new Map();

  constructor() {
    eventBus.subscribe(this.handleEvent.bind(this));
  }

  public async init(): Promise<void> {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id', 'workspace_id', 'account_id'])
      .execute();

    for (const workspace of workspaces) {
      this.workspaceStates.set(workspace.user_id, {
        userId: workspace.user_id,
        workspaceId: workspace.workspace_id,
        accountId: workspace.account_id,
        nodeStates: {},
        importantCount: 0,
        hasUnseenChanges: false,
      });

      await this.initWorkspace(workspace.user_id);
    }
  }

  public getData(): Record<string, WorkspaceRadarData> {
    return Object.fromEntries(this.workspaceStates);
  }

  private async initWorkspace(userId: string): Promise<void> {
    let existingData = this.workspaceStates.get(userId);
    if (!existingData) {
      const workspace = await databaseService.appDatabase
        .selectFrom('workspaces')
        .select(['user_id', 'workspace_id', 'account_id'])
        .where('user_id', '=', userId)
        .executeTakeFirst();

      if (!workspace) {
        return;
      }

      existingData = {
        userId,
        workspaceId: workspace.workspace_id,
        accountId: workspace.account_id,
        nodeStates: {},
        importantCount: 0,
        hasUnseenChanges: false,
      };
    }

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const data: WorkspaceRadarData = {
      accountId: existingData.accountId,
      workspaceId: existingData.workspaceId,
      userId: existingData.userId,
      hasUnseenChanges: false,
      importantCount: 0,
      nodeStates: {},
    };

    const nodeUnreadMessageCounts = await workspaceDatabase
      .selectFrom('interactions as i')
      .innerJoin('nodes as n', 'i.node_id', 'n.id')
      .where('i.user_id', '=', userId)
      .where('n.type', '=', 'message')
      .where('n.created_by', '!=', userId)
      .where('i.last_seen_at', 'is', null)
      .select(['n.parent_id as node_id'])
      .select((eb) => [eb.fn.count<number>('i.node_id').as('messages_count')])
      .groupBy('n.parent_id')
      .execute();

    for (const nodeUnreadMessageCount of nodeUnreadMessageCounts) {
      const idType = getIdType(nodeUnreadMessageCount.node_id);
      const nodeId = nodeUnreadMessageCount.node_id;
      const messagesCount = nodeUnreadMessageCount.messages_count;

      if (idType === IdType.Chat) {
        data.nodeStates[nodeId] = {
          type: 'chat',
          nodeId,
          unseenMessagesCount: messagesCount,
          mentionsCount: 0,
        };

        if (messagesCount > 0) {
          data.importantCount += messagesCount;
        }
      } else if (idType === IdType.Channel) {
        data.nodeStates[nodeId] = {
          type: 'channel',
          nodeId,
          unseenMessagesCount: messagesCount,
          mentionsCount: 0,
        };

        if (messagesCount > 0) {
          data.hasUnseenChanges = true;
        }
      }
    }

    this.workspaceStates.set(userId, data);
  }

  private async handleEvent(event: Event) {
    if (event.type === 'workspace_deleted') {
      this.workspaceStates.delete(event.workspace.userId);
      eventBus.publish({
        type: 'radar_data_updated',
      });
    } else if (
      event.type === 'interaction_updated' &&
      event.userId === event.interaction.userId
    ) {
      await this.initWorkspace(event.userId);
      eventBus.publish({
        type: 'radar_data_updated',
      });
    }
  }
}

export const radarService = new RadarService();
