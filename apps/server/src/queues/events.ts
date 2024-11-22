import { database } from '@/data/database';
import { redisConfig } from '@/data/redis';
import { CreateUserNode } from '@/data/schema';
import { filesStorage } from '@/data/storage';
import { BUCKET_NAMES } from '@/data/storage';
import {
  extractNodeCollaborators,
  generateId,
  IdType,
  NodeTypes,
} from '@colanode/core';
import { fetchNodeCollaborators, fetchWorkspaceUsers } from '@/lib/nodes';
import { synapse } from '@/services/synapse';
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Job, Queue, Worker } from 'bullmq';
import { difference } from 'lodash-es';
import { enqueueTask } from '@/queues/tasks';
import { logService } from '@/services/log';

const logger = logService.createLogger('events');

const eventQueue = new Queue('events', {
  connection: {
    host: redisConfig.host,
    password: redisConfig.password,
    port: redisConfig.port,
    db: redisConfig.db,
  },
  defaultJobOptions: {
    removeOnComplete: true,
  },
});

export const enqueueEvent = async (event: NodeEvent): Promise<void> => {
  logger.trace(event, 'Enqueuing event');

  await eventQueue.add('event', event);
};

export const initEventWorker = () => {
  logger.info('Initializing event worker');

  return new Worker('events', handleEventJob, {
    connection: {
      host: redisConfig.host,
      password: redisConfig.password,
      port: redisConfig.port,
      db: redisConfig.db,
    },
  });
};

const handleEventJob = async (job: Job) => {
  const event = job.data as NodeEvent;
  logger.trace(event, 'Handling event');

  switch (event.type) {
    case 'node_created':
      return handleNodeCreatedEvent(event);
    case 'node_updated':
      return handleNodeUpdatedEvent(event);
    case 'node_deleted':
      return handleNodeDeletedEvent(event);
  }
};

const handleNodeCreatedEvent = async (
  event: NodeCreatedEvent
): Promise<void> => {
  await createUserNodes(event);
  await synapse.sendSynapseMessage({
    type: 'node_create',
    nodeId: event.id,
    workspaceId: event.workspaceId,
  });
};

const handleNodeUpdatedEvent = async (
  event: NodeUpdatedEvent
): Promise<void> => {
  await checkForCollaboratorsChange(event);
  await checkForUserRoleChange(event);

  await synapse.sendSynapseMessage({
    type: 'node_update',
    nodeId: event.id,
    workspaceId: event.workspaceId,
  });
};

const handleNodeDeletedEvent = async (
  event: NodeDeletedEvent
): Promise<void> => {
  logger.trace(event, 'Handling node deleted event');

  if (event.attributes.type === 'file') {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: `files/${event.id}${event.attributes.extension}`,
    });

    await filesStorage.send(command);
  }

  await synapse.sendSynapseMessage({
    type: 'node_delete',
    nodeId: event.id,
    workspaceId: event.workspaceId,
  });
};

const createUserNodes = async (event: NodeCreatedEvent): Promise<void> => {
  logger.trace(event, 'Creating user nodes');

  const userNodesToCreate: CreateUserNode[] = [];

  if (event.attributes.type === NodeTypes.User) {
    userNodesToCreate.push({
      user_id: event.id,
      node_id: event.workspaceId,
      workspace_id: event.workspaceId,
      mentions_count: 0,
      created_at: new Date(),
      version_id: generateId(IdType.Version),
    });

    const userIds = await fetchWorkspaceUsers(event.workspaceId);

    for (const userId of userIds) {
      userNodesToCreate.push({
        user_id: userId,
        node_id: event.id,
        workspace_id: event.workspaceId,
        last_seen_at: null,
        last_seen_version_id: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });

      if (userId === event.id) {
        continue;
      }

      userNodesToCreate.push({
        user_id: event.id,
        node_id: userId,
        workspace_id: event.workspaceId,
        last_seen_version_id: null,
        last_seen_at: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });
    }
  } else if (event.attributes.type === NodeTypes.Workspace) {
    const userIds = await fetchWorkspaceUsers(event.workspaceId);

    for (const userId of userIds) {
      userNodesToCreate.push({
        user_id: userId,
        node_id: event.id,
        workspace_id: event.workspaceId,
        last_seen_at: null,
        last_seen_version_id: null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });
    }
  } else {
    const collaborators = await fetchNodeCollaborators(event.id);
    const collaboratorIds = collaborators.map((c) => c.collaboratorId);

    for (const collaboratorId of collaboratorIds) {
      userNodesToCreate.push({
        user_id: collaboratorId,
        node_id: event.id,
        workspace_id: event.workspaceId,
        last_seen_at:
          collaboratorId === event.createdBy ? new Date(event.createdAt) : null,
        last_seen_version_id:
          collaboratorId === event.createdBy ? event.versionId : null,
        mentions_count: 0,
        created_at: new Date(),
        access_removed_at: null,
        version_id: generateId(IdType.Version),
        updated_at: null,
      });
    }
  }

  if (userNodesToCreate.length > 0) {
    logger.trace(userNodesToCreate, 'Creating user nodes');

    await database
      .insertInto('user_nodes')
      .values(userNodesToCreate)
      .onConflict((cb) => cb.doNothing())
      .execute();
  }
};

const checkForCollaboratorsChange = async (
  event: NodeUpdatedEvent
): Promise<void> => {
  logger.trace(event, 'Checking for collaborators change');

  const beforeCollaborators = Object.keys(
    extractNodeCollaborators(event.beforeAttributes)
  );
  const afterCollaborators = Object.keys(
    extractNodeCollaborators(event.afterAttributes)
  );

  if (beforeCollaborators.length === 0 && afterCollaborators.length === 0) {
    return;
  }

  const addedCollaborators = difference(
    afterCollaborators,
    beforeCollaborators
  );

  const removedCollaborators = difference(
    beforeCollaborators,
    afterCollaborators
  );

  if (addedCollaborators.length === 0 && removedCollaborators.length === 0) {
    return;
  }

  if (addedCollaborators.length > 0) {
    const existingUserNodes = await database
      .selectFrom('user_nodes')
      .select('user_id')
      .where('node_id', '=', event.id)
      .where('user_id', 'in', addedCollaborators)
      .execute();

    const existingCollaboratorIds = existingUserNodes.map((e) => e.user_id);

    const actualAddedCollaborators = difference(
      addedCollaborators,
      existingCollaboratorIds
    );

    if (actualAddedCollaborators.length > 0) {
      const descendants = await database
        .selectFrom('node_paths')
        .select('descendant_id')
        .where('ancestor_id', '=', event.id)
        .execute();

      const descendantIds = descendants.map((d) => d.descendant_id);
      const userNodesToCreate: CreateUserNode[] = [];
      for (const collaboratorId of addedCollaborators) {
        for (const descendantId of descendantIds) {
          userNodesToCreate.push({
            user_id: collaboratorId,
            node_id: descendantId,
            last_seen_version_id: null,
            workspace_id: event.workspaceId,
            last_seen_at: null,
            mentions_count: 0,
            created_at: new Date(),
            access_removed_at: null,
            version_id: generateId(IdType.Version),
          });
        }
      }

      if (userNodesToCreate.length > 0) {
        await database
          .insertInto('user_nodes')
          .values(userNodesToCreate)
          .onConflict((cb) => cb.doNothing())
          .execute();
      }
    }
  }

  if (removedCollaborators.length > 0) {
    const nodeCollaborators = await fetchNodeCollaborators(event.id);
    const nodeCollaboratorIds = nodeCollaborators.map((c) => c.collaboratorId);
    const actualRemovedCollaborators = difference(
      removedCollaborators,
      nodeCollaboratorIds
    );

    if (actualRemovedCollaborators.length > 0) {
      const descendants = await database
        .selectFrom('node_paths')
        .select('descendant_id')
        .where('ancestor_id', '=', event.id)
        .execute();

      const descendantIds = descendants.map((d) => d.descendant_id);
      await database
        .updateTable('user_nodes')
        .set({
          access_removed_at: new Date(),
        })
        .where('user_id', 'in', actualRemovedCollaborators)
        .where('node_id', 'in', descendantIds)
        .execute();
    }
  }
};

const checkForUserRoleChange = async (
  event: NodeUpdatedEvent
): Promise<void> => {
  logger.trace(event, 'Checking for user role change');

  if (
    event.beforeAttributes.type !== 'user' ||
    event.afterAttributes.type !== 'user'
  ) {
    return;
  }

  const beforeRole = event.beforeAttributes.role;
  const afterRole = event.afterAttributes.role;

  if (beforeRole === afterRole) {
    return;
  }

  if (afterRole === 'none') {
    await enqueueTask({
      type: 'clean_user_device_nodes',
      userId: event.id,
      workspaceId: event.workspaceId,
    });
  }
};
