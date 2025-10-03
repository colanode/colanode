import { useMemo } from 'react';

import { router } from '@colanode/ui/routes';

interface TabBarContentProps {
  location: string;
  router: typeof router;
}

export const LayoutTabBarContent = ({
  location,
  router,
}: TabBarContentProps) => {
  const tabComponent = useMemo(() => {
    const matches = router.matchRoutes(location);
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      if (match?.context && 'tab' in match.context) {
        return match.context.tab;
      }
    }

    return null;
  }, [location]);

  return (
    <div className="truncate text-sm font-medium">
      {tabComponent || 'New tab'}
    </div>
  );
};
