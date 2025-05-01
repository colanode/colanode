import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  SyncMutationResult,
  SyncMutationStatus,
  Mutation,
  CreateNodeMutation,
  DeleteNodeMutation,
  CreateNodeReactionMutation,
  DeleteNodeReactionMutation,
  MarkNodeSeenMutation,
  MarkNodeOpenedMutation,
  UpdateNodeMutation,
  UpdateDocumentMutation,
  syncMutationsInputSchema,
} from '@colanode/core';

import { SelectUser } from '@/data/schema';
import {
  createNodeFromMutation,
  updateNodeFromMutation,
  deleteNode,
} from '@/lib/nodes';
import { createNodeReaction, deleteNodeReaction } from '@/lib/node-reactions';
import { markNodeAsOpened, markNodeAsSeen } from '@/lib/node-interactions';
import { updateDocumentFromMutation } from '@/lib/documents';

export const mutationsSyncRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/',
    schema: {
      body: syncMutationsInputSchema,
    },
    handler: async (request) => {
      const input = request.body;
      const user = request.user;

      const results: SyncMutationResult[] = [];
      for (const mutation of input.mutations) {
        try {
          const status = await handleMutation(user, mutation);
          results.push({
            id: mutation.id,
            status: status,
          });
        } catch {
          results.push({
            id: mutation.id,
            status: 'error',
          });
        }
      }

      return { results };
    },
  });

  done();
};

const handleMutation = async (
  user: SelectUser,
  mutation: Mutation
): Promise<SyncMutationStatus> => {
  if (mutation.type === 'create_node') {
    return await handleCreateNode(user, mutation);
  } else if (mutation.type === 'update_node') {
    return await handleUpdateNode(user, mutation);
  } else if (mutation.type === 'delete_node') {
    return await handleDeleteNode(user, mutation);
  } else if (mutation.type === 'create_node_reaction') {
    return await handleCreateNodeReaction(user, mutation);
  } else if (mutation.type === 'delete_node_reaction') {
    return await handleDeleteNodeReaction(user, mutation);
  } else if (mutation.type === 'mark_node_seen') {
    return await handleMarkNodeSeen(user, mutation);
  } else if (mutation.type === 'mark_node_opened') {
    return await handleMarkNodeOpened(user, mutation);
  } else if (mutation.type === 'update_document') {
    return await handleUpdateDocument(user, mutation);
  } else {
    return 'error';
  }
};

const handleCreateNode = async (
  user: SelectUser,
  mutation: CreateNodeMutation
): Promise<SyncMutationStatus> => {
  const output = await createNodeFromMutation(user, mutation.data);

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleUpdateNode = async (
  user: SelectUser,
  mutation: UpdateNodeMutation
): Promise<SyncMutationStatus> => {
  const output = await updateNodeFromMutation(user, mutation.data);

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleDeleteNode = async (
  user: SelectUser,
  mutation: DeleteNodeMutation
): Promise<SyncMutationStatus> => {
  const output = await deleteNode(user, {
    nodeId: mutation.data.nodeId,
    rootId: mutation.data.rootId,
    deletedAt: mutation.data.deletedAt,
  });

  if (!output) {
    return 'error';
  }

  return 'success';
};

const handleCreateNodeReaction = async (
  user: SelectUser,
  mutation: CreateNodeReactionMutation
): Promise<SyncMutationStatus> => {
  const output = await createNodeReaction(user, mutation);
  return output ? 'success' : 'error';
};

const handleDeleteNodeReaction = async (
  user: SelectUser,
  mutation: DeleteNodeReactionMutation
): Promise<SyncMutationStatus> => {
  const output = await deleteNodeReaction(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkNodeSeen = async (
  user: SelectUser,
  mutation: MarkNodeSeenMutation
): Promise<SyncMutationStatus> => {
  const output = await markNodeAsSeen(user, mutation);
  return output ? 'success' : 'error';
};

const handleMarkNodeOpened = async (
  user: SelectUser,
  mutation: MarkNodeOpenedMutation
): Promise<SyncMutationStatus> => {
  const output = await markNodeAsOpened(user, mutation);
  return output ? 'success' : 'error';
};

const handleUpdateDocument = async (
  user: SelectUser,
  mutation: UpdateDocumentMutation
): Promise<SyncMutationStatus> => {
  const output = await updateDocumentFromMutation(user, mutation.data);
  return output ? 'success' : 'error';
};
