import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const AppHomeScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
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
