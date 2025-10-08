import { createCollection } from '@tanstack/react-db';

import { Tab } from '@colanode/client/types';

export const createTabsCollection = () => {
  return createCollection<Tab, string>({
    getKey(item) {
      return item.id;
    },
    sync: {
      async sync({ begin, write, commit, markReady }) {
        const tabs = await window.colanode.executeQuery({
          type: 'tabs.list',
        });

        begin();

        for (const tab of tabs) {
          write({ type: 'insert', value: tab });
        }

        commit();
        markReady();

        window.eventBus.subscribe((event) => {
          if (event.type === 'tab.created') {
            begin();
            write({ type: 'insert', value: event.tab });
            commit();
          } else if (event.type === 'tab.updated') {
            begin();
            write({ type: 'update', value: event.tab });
            commit();
          } else if (event.type === 'tab.deleted') {
            begin();
            write({ type: 'delete', value: event.tab });
            commit();
          }
        });
      },
    },
    onInsert: async ({ transaction }) => {
      const tab = transaction.mutations[0].modified;
      return await window.colanode.executeMutation({
        type: 'tab.create',
        id: tab.id,
        location: tab.location,
        index: tab.index,
      });
    },
    onUpdate: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map(async (mutation) => {
          const { original, changes } = mutation;
          if (!(`id` in original)) {
            throw new Error(`Original todo not found for update`);
          }

          return await window.colanode.executeMutation({
            type: 'tab.update',
            id: original.id,
            location: changes.location,
            index: changes.index,
          });
        })
      );
    },
    onDelete: async ({ transaction }) => {
      return await Promise.all(
        transaction.mutations.map(async (mutation) => {
          const { original } = mutation;
          if (!(`id` in original)) {
            throw new Error(`Original todo not found for delete`);
          }

          await window.colanode.executeMutation({
            type: 'tab.delete',
            id: original.id,
          });
        })
      );
    },
  });
};
