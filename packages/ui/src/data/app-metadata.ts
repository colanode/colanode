import { createCollection } from '@tanstack/react-db';

import { AppMetadata } from '@colanode/client/types';

export const createAppMetadataCollection = () => {
  return createCollection<AppMetadata, string>({
    getKey(item) {
      return item.key;
    },
    sync: {
      async sync({ begin, write, commit, markReady, collection }) {
        const appMetadata = await window.colanode.executeQuery({
          type: 'app.metadata.list',
        });

        begin();

        for (const item of appMetadata) {
          write({ type: 'insert', value: item });
        }

        commit();
        markReady();

        window.eventBus.subscribe((event) => {
          if (event.type === 'app.metadata.updated') {
            const existing = collection.get(event.metadata.key);
            if (existing) {
              begin();
              write({ type: 'update', value: event.metadata });
              commit();
            } else {
              begin();
              write({ type: 'insert', value: event.metadata });
              commit();
            }
          } else if (event.type === 'app.metadata.deleted') {
            begin();
            write({ type: 'delete', value: event.metadata });
            commit();
          }
        });
      },
    },
    onInsert: async ({ transaction }) => {
      const metadata = transaction.mutations[0].modified;
      return await window.colanode.executeMutation({
        type: 'app.metadata.update',
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
            type: 'app.metadata.update',
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
            type: 'app.metadata.delete',
            key: original.key,
          });
        })
      );
    },
  });
};
