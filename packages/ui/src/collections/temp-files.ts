import { createCollection } from '@tanstack/react-db';

import { TempFile } from '@colanode/client/types';

export const createTempFilesCollection = () => {
  return createCollection<TempFile, string>({
    getKey(item) {
      return item.id;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'temp.file.list',
          })
          .then((tempFiles) => {
            begin();

            for (const tempFile of tempFiles) {
              write({ type: 'insert', value: tempFile });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'temp.file.created') {
            begin();
            write({ type: 'insert', value: event.tempFile });
            commit();
          } else if (event.type === 'temp.file.deleted') {
            begin();
            write({ type: 'delete', value: event.tempFile });
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
  });
};
