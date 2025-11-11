import { useRouter, useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';

export const ContainerHeader = () => {
  const router = useRouter();
  const location = useLocation();

  const headerComponent = useMemo(() => {
    const matches = router.matchRoutes(location.href);
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      if (match?.context && 'header' in match.context) {
        return match.context.header;
      }
    }

    return null;
  }, [router, location.href]);

  return headerComponent;
};
