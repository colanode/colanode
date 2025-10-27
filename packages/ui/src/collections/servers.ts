import { createCollection } from '@tanstack/react-db';

import { Server } from '@colanode/client/types';

export const createServersCollection = () => {
  return createCollection<Server, string>({
    getKey(item) {
      return item.domain;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'server.list',
          })
          .then((servers) => {
            begin();

            for (const server of servers) {
              write({ type: 'insert', value: server });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'server.created') {
            begin();
            write({ type: 'insert', value: event.server });
            commit();
          } else if (event.type === 'server.updated') {
            begin();
            write({ type: 'update', value: event.server });
            commit();
          } else if (event.type === 'server.deleted') {
            begin();
            write({ type: 'delete', value: event.server });
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
