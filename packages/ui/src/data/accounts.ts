import { createCollection } from '@tanstack/react-db';

import { Account } from '@colanode/client/types';

export const createAccountsCollection = () => {
  return createCollection<Account, string>({
    getKey(item) {
      return item.id;
    },
    sync: {
      async sync({ begin, write, commit, markReady }) {
        const accounts = await window.colanode.executeQuery({
          type: 'account.list',
        });

        begin();

        for (const account of accounts) {
          write({ type: 'insert', value: account });
        }

        commit();
        markReady();

        window.eventBus.subscribe((event) => {
          if (event.type === 'account.created') {
            begin();
            write({ type: 'insert', value: event.account });
            commit();
          } else if (event.type === 'account.updated') {
            begin();
            write({ type: 'update', value: event.account });
            commit();
          } else if (event.type === 'account.deleted') {
            begin();
            write({ type: 'delete', value: event.account });
            commit();
          }
        });
      },
    },
  });
};
