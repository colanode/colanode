import { createCollection } from '@tanstack/react-db';

import { Workspace } from '@colanode/client/types';

export const createWorkspacesCollection = () => {
  return createCollection<Workspace, string>({
    getKey(item) {
      return item.userId;
    },
    sync: {
      sync({ begin, write, commit, markReady }) {
        window.colanode
          .executeQuery({
            type: 'workspace.list',
          })
          .then((workspaces) => {
            begin();

            for (const workspace of workspaces) {
              write({ type: 'insert', value: workspace });
            }

            commit();
            markReady();
          });

        const subscriptionId = window.eventBus.subscribe((event) => {
          if (event.type === 'workspace.created') {
            begin();
            write({ type: 'insert', value: event.workspace });
            commit();
          } else if (event.type === 'workspace.updated') {
            begin();
            write({ type: 'update', value: event.workspace });
            commit();
          } else if (event.type === 'workspace.deleted') {
            begin();
            write({ type: 'delete', value: event.workspace });
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
