import { createCollection } from '@tanstack/react-db';

import { Upload } from '@colanode/client/types';

export const createUploadsCollection = (userId: string) => {
  return createCollection<Upload, string>({
    getKey(item) {
      return item.fileId;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'upload.list',
            userId,
          })
          .then((uploads) => {
            begin();

            for (const upload of uploads) {
              write({ type: 'insert', value: upload });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'upload.created') {
            begin();
            write({ type: 'insert', value: event.upload });
            commit();
          } else if (event.type === 'upload.updated') {
            begin();
            write({ type: 'update', value: event.upload });
            commit();
          } else if (event.type === 'upload.deleted') {
            begin();
            write({ type: 'delete', value: event.upload });
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
