import { createCollection, parseLoadSubsetOptions } from '@tanstack/react-db';

import { LocalNode } from '@colanode/client/types';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

export const createNodesCollection = (userId: string) => {
  return createCollection<LocalNode, string>({
    getKey(item) {
      return item.id;
    },
    syncMode: 'on-demand',

    sync: {
      rowUpdateMode: 'full',
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'node.list',
            userId,
            filters: [
              {
                field: ['type'],
                operator: 'in',
                value: ['space', 'chat', 'database', 'channel'],
              },
            ],
            sorts: [],
          })
          .then((nodes) => {
            begin();
            for (const node of nodes) {
              write({ type: 'insert', value: node });
            }
            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (
            event.type === 'node.created' &&
            event.workspace.userId === userId
          ) {
            begin();
            write({ type: 'insert', value: event.node });
            commit();
          } else if (
            event.type === 'node.updated' &&
            event.workspace.userId === userId
          ) {
            begin();
            write({ type: 'update', value: event.node });
            commit();
          } else if (
            event.type === 'node.deleted' &&
            event.workspace.userId === userId
          ) {
            begin();
            write({ type: 'delete', value: event.node });
            commit();
          }
        });

        return {
          cleanup: () => window.eventBus.unsubscribe(subscriptionId),
          loadSubset: async (options) => {
            const parsedOptions = parseLoadSubsetOptions(options);

            const nodes = await window.colanode.executeQuery({
              type: 'node.list',
              userId,
              filters: parsedOptions.filters,
              sorts: parsedOptions.sorts,
              limit: parsedOptions.limit,
            });

            begin();
            for (const node of nodes) {
              write({ type: 'insert', value: node });
            }
            commit();
          },
        };
      },
    },
    onInsert: async ({ transaction }) => {
      await applyNodeTransaction(userId, transaction);
    },
    onUpdate: async ({ transaction }) => {
      await applyNodeTransaction(userId, transaction);
    },
    onDelete: async ({ transaction }) => {
      await applyNodeTransaction(userId, transaction);
    },
  });
};
