import { createCollection } from '@tanstack/react-db';

import { LocalNode } from '@colanode/client/types';
import { applyNodeTransaction } from '@colanode/ui/lib/nodes';

export const createNodesCollection = (userId: string) => {
  return createCollection<LocalNode, string>({
    getKey(item) {
      return item.id;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'node.list',
            userId,
          })
          .then((nodes) => {
            console.log('nodes', nodes);
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
            console.log('loadSubset', options);
          },
        };
      },
    },
    onInsert: async ({ transaction }) => {
      await applyNodeTransaction(userId, transaction);
    },
    onUpdate: async ({ transaction }) => {
      console.log('onUpdate', transaction);
      await applyNodeTransaction(userId, transaction);
    },
    onDelete: async ({ transaction }) => {
      await applyNodeTransaction(userId, transaction);
    },
  });
};
