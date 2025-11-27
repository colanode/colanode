import { createCollection, parseLoadSubsetOptions } from '@tanstack/react-db';

import { NodeReaction } from '@colanode/client/types';
import {
  applyNodeReactionTransaction,
  buildNodeReactionKey,
} from '@colanode/ui/lib/nodes';

export const createNodeReactionsCollection = (userId: string) => {
  const loadedNodeIds = new Set<string>();
  return createCollection<NodeReaction, string>({
    syncMode: 'on-demand',
    getKey(item) {
      return buildNodeReactionKey(
        item.nodeId,
        item.collaboratorId,
        item.reaction
      );
    },
    sync: {
      sync({ begin, write, commit }) {
        const subscriptionId = window.eventBus.subscribe((event) => {
          if (
            event.type === 'node.reaction.created' &&
            event.workspace.userId === userId &&
            loadedNodeIds.has(event.nodeReaction.nodeId)
          ) {
            begin();
            write({ type: 'insert', value: event.nodeReaction });
            commit();
          } else if (
            event.type === 'node.reaction.deleted' &&
            event.workspace.userId === userId &&
            loadedNodeIds.has(event.nodeReaction.nodeId)
          ) {
            begin();
            write({ type: 'delete', value: event.nodeReaction });
            commit();
          }
        });

        return {
          cleanup: () => window.eventBus.unsubscribe(subscriptionId),
          loadSubset: async (options) => {
            const parsedOptions = parseLoadSubsetOptions(options);
            const nodeId = parsedOptions.filters.find(
              (filter) => filter.field.join('.') === 'nodeId'
            )?.value;

            if (!nodeId) {
              return;
            }

            if (loadedNodeIds.has(nodeId)) {
              return;
            }

            loadedNodeIds.add(nodeId);
            const nodeReactions = await window.colanode.executeQuery({
              type: 'node.reaction.list',
              userId,
              nodeId,
            });

            begin();
            for (const nodeReaction of nodeReactions) {
              write({ type: 'insert', value: nodeReaction });
            }
            commit();
          },
        };
      },
    },
    onInsert: async ({ transaction }) => {
      await applyNodeReactionTransaction(userId, transaction);
    },
    onUpdate: async ({ transaction }) => {
      await applyNodeReactionTransaction(userId, transaction);
    },
    onDelete: async ({ transaction }) => {
      await applyNodeReactionTransaction(userId, transaction);
    },
  });
};
