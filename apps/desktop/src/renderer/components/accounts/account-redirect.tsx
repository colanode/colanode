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
        if (data.length === 0) {
          navigate('/login');
        } else {
          navigate(`/${data[0].id}`);
        }
      });
  }, [navigate]);

  return null;
};
