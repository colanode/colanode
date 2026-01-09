import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import {
  SyncMutationResult,
  MutationStatus,
  Mutation,
  syncMutationsInputSchema,
  ApiErrorCode,
  WorkspaceStatus,
} from '@colanode/core';
import { updateDocumentFromMutation } from '@colanode/server/lib/documents';
import {
  markNodeAsOpened,
  markNodeAsSeen,
} from '@colanode/server/lib/node-interactions';
import {
  createNodeReaction,
  deleteNodeReaction,
} from '@colanode/server/lib/node-reactions';
import {
  createNodeFromMutation,
  updateNodeFromMutation,
  deleteNodeFromMutation,
} from '@colanode/server/lib/nodes';
import { WorkspaceContext } from '@colanode/server/types/api';

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
    handler: async (request, reply) => {
      const input = request.body;
      const workspace = request.workspace;

      if (workspace.status === WorkspaceStatus.Readonly) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceReadonly,
          message: 'Workspace is readonly and you cannot make any changes.',
        });
      }

      const results: SyncMutationResult[] = [];
      for (const mutation of input.mutations) {
        try {
          const status = await handleMutation(workspace, mutation);
          results.push({
            id: mutation.id,
            status: status,
          });
        } catch {
          results.push({
            id: mutation.id,
            status: MutationStatus.INTERNAL_SERVER_ERROR,
          });
        }
      }

      return { results };
    },
  });

  done();
};

const handleMutation = async (
  workspace: WorkspaceContext,
  mutation: Mutation
): Promise<MutationStatus> => {
  if (mutation.type === 'node.create') {
    return await createNodeFromMutation(workspace, mutation.data);
  } else if (mutation.type === 'node.update') {
    return await updateNodeFromMutation(workspace, mutation.data);
  } else if (mutation.type === 'node.delete') {
    return await deleteNodeFromMutation(workspace, mutation.data);
  } else if (mutation.type === 'node.reaction.create') {
    return await createNodeReaction(workspace, mutation);
  } else if (mutation.type === 'node.reaction.delete') {
    return await deleteNodeReaction(workspace, mutation);
  } else if (mutation.type === 'node.interaction.seen') {
    return await markNodeAsSeen(workspace, mutation);
  } else if (mutation.type === 'node.interaction.opened') {
    return await markNodeAsOpened(workspace, mutation);
  } else if (mutation.type === 'document.update') {
    return await updateDocumentFromMutation(workspace, mutation.data);
  } else {
    return MutationStatus.METHOD_NOT_ALLOWED;
  }
};
