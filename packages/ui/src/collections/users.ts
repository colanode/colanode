import { createCollection } from '@tanstack/react-db';

import { User } from '@colanode/client/types';

export const createUsersCollection = (userId: string) => {
  return createCollection<User, string>({
    getKey(item) {
      return item.id;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'user.list',
            userId,
          })
          .then((users) => {
            begin();

            for (const user of users) {
              write({ type: 'insert', value: user });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'user.created') {
            begin();
            write({ type: 'insert', value: event.user });
            commit();
          } else if (event.type === 'user.updated') {
            begin();
            write({ type: 'update', value: event.user });
            commit();
          } else if (event.type === 'user.deleted') {
            begin();
            write({ type: 'delete', value: event.user });
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
