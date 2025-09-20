import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAppMetadata } from '@colanode/ui/contexts/app-metadata';

export const AppHomeScreen = () => {
  const appMetadata = useAppMetadata();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const lastUsedAccount = appMetadata.get('account');
      if (lastUsedAccount) {
        navigate({
          to: '/acc/$accountId',
          replace: true,
          params: { accountId: lastUsedAccount },
        });
        return;
      }

      const accounts = await window.colanode.executeQuery({
        type: 'account.list',
      });

      if (accounts.length === 0) {
        navigate({ to: '/login', replace: true });
        return;
      }

      const account = accounts[0]!;
      navigate({
        to: '/acc/$accountId',
        params: { accountId: account.id },
        replace: true,
      });
    })();
  }, []);

  return null;
};
