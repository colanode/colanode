import { createCollection } from '@tanstack/react-db';

import { LocalNode } from '@colanode/client/types';

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
            begin();

            for (const node of nodes) {
              write({ type: 'insert', value: node });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'node.created') {
            begin();
            write({ type: 'insert', value: event.node });
            commit();
          } else if (event.type === 'node.updated') {
            begin();
            write({ type: 'update', value: event.node });
            commit();
          } else if (event.type === 'node.deleted') {
            begin();
            write({ type: 'delete', value: event.node });
            commit();
          }
        });

        return {
          cleanup: () => {
            window.eventBus.unsubscribe(subscriptionId);
          },
        };
      },
    },
    onInsert: async ({ transaction }) => {
      transaction.mutations.forEach(async (mutation) => {
        await window.colanode.executeMutation({
          type: 'node.create',
          userId,
          node: mutation.modified,
        });
      });
    },
    onUpdate: async ({ transaction }) => {
      transaction.mutations.forEach(async (mutation) => {
        console.log('onUpdate', mutation);
        const attributes = mutation.changes.attributes;
        if (!attributes) {
          return;
        }

        await window.colanode.executeMutation({
          type: 'node.update',
          userId,
          nodeId: mutation.key,
          attributes,
        });
      });
    },
    onDelete: async ({ transaction }) => {
      transaction.mutations.forEach(async (mutation) => {
        await window.colanode.executeMutation({
          type: 'node.delete',
          userId,
          nodeId: mutation.key,
        });
      });
    },
  });
};
