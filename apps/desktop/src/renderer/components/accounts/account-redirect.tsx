import React from 'react';
import { useQuery } from '@/renderer/hooks/use-query';
import { useNavigate } from 'react-router-dom';

export const AccountRedirect = (): React.ReactNode => {
  const navigate = useNavigate();
  const { data, isPending } = useQuery({
    type: 'account_list',
  });

  React.useEffect(() => {
    if (isPending) {
      return;
    }

    if (data.length == 0) {
      navigate('/login');
      return;
    }

    navigate(`/${data[0].id}`);
  }, [data, isPending, navigate]);

  return null;
};
