import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import {
  SyncMutationResult,
  MutationStatus,
  Mutation,
  syncMutationsInputSchema,
} from '@colanode/core';
import { SelectUser } from '@colanode/server/data/schema';
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
  user: SelectUser,
  mutation: Mutation
): Promise<MutationStatus> => {
  if (mutation.type === 'node.create') {
    return await createNodeFromMutation(user, mutation.data);
  } else if (mutation.type === 'node.update') {
    return await updateNodeFromMutation(user, mutation.data);
  } else if (mutation.type === 'node.delete') {
    return await deleteNodeFromMutation(user, mutation.data);
  } else if (mutation.type === 'node.reaction.create') {
    return await createNodeReaction(user, mutation);
  } else if (mutation.type === 'node.reaction.delete') {
    return await deleteNodeReaction(user, mutation);
  } else if (mutation.type === 'node.interaction.seen') {
    return await markNodeAsSeen(user, mutation);
  } else if (mutation.type === 'node.interaction.opened') {
    return await markNodeAsOpened(user, mutation);
  } else if (mutation.type === 'document.update') {
    return await updateDocumentFromMutation(user, mutation.data);
  } else {
    return MutationStatus.METHOD_NOT_ALLOWED;
  }
};
