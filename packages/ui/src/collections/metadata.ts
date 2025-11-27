import { createCollection } from '@tanstack/react-db';

import { Metadata } from '@colanode/client/types';

export const buildMetadataKey = (namespace: string, key: string) => {
  return `${namespace}.${key}`;
};

export const createMetadataCollection = () => {
  return createCollection<Metadata, string>({
    getKey(item) {
      return buildMetadataKey(item.namespace, item.key);
    },
    sync: {
      sync({ begin, write, commit, markReady, collection }) {
        window.colanode
          .executeQuery({
            type: 'metadata.list',
          })
          .then((metadata) => {
            begin();

            for (const item of metadata) {
              write({ type: 'insert', value: item });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'metadata.updated') {
            const metadata = event.metadata;
            const metadataKey = buildMetadataKey(
              metadata.namespace,
              metadata.key
            );
            const existing = collection.get(metadataKey);
            if (existing) {
              begin();
              write({ type: 'update', value: metadata });
              commit();
            } else {
              begin();
              write({ type: 'insert', value: metadata });
              commit();
            }
          } else if (event.type === 'metadata.deleted') {
            begin();
            write({ type: 'delete', value: event.metadata });
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
      const metadata = transaction.mutations[0].modified;
      return await window.colanode.executeMutation({
        type: 'metadata.update',
        namespace: metadata.namespace,
        key: metadata.key,
        value: metadata.value,
      });
    },
    onUpdate: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map(async (mutation) => {
          const { original, changes } = mutation;
          if (!(`key` in original)) {
            throw new Error(`Original todo not found for update`);
          }

          if (!changes.value) {
            return;
          }

          return await window.colanode.executeMutation({
            type: 'metadata.update',
            namespace: original.namespace,
            key: original.key,
            value: changes.value,
          });
        })
      );
    },
    onDelete: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map(async (mutation) => {
          const { original } = mutation;
          if (!(`key` in original)) {
            throw new Error(`Original app metadata not found for delete`);
          }

          await window.colanode.executeMutation({
            type: 'metadata.delete',
            namespace: original.namespace,
            key: original.key,
          });
        })
      );
    },
  });
};
