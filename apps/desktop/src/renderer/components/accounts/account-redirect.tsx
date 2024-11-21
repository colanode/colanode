import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AccountRedirect = (): React.ReactNode => {
  const navigate = useNavigate();

  React.useEffect(() => {
    window.colanode
      .executeQuery({
        type: 'account_list',
      })
      .then((data) => {
        const firstAccount = data?.[0];

        if (firstAccount) {
          navigate(`/${firstAccount.id}`);
        } else {
          navigate('/login');
        }
      });
  }, [navigate]);

  return null;
};
