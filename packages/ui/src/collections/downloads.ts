import { createCollection } from '@tanstack/react-db';

import { Download } from '@colanode/client/types';

export const createDownloadsCollection = (userId: string) => {
  return createCollection<Download, string>({
    getKey(item) {
      return item.id;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'download.list',
            userId,
          })
          .then((downloads) => {
            begin();

            for (const download of downloads) {
              write({ type: 'insert', value: download });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'download.created') {
            begin();
            write({ type: 'insert', value: event.download });
            commit();
          } else if (event.type === 'download.updated') {
            begin();
            write({ type: 'update', value: event.download });
            commit();
          } else if (event.type === 'download.deleted') {
            begin();
            write({ type: 'delete', value: event.download });
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
