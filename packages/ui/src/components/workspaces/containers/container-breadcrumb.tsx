import { useRouter, useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';

import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';

export const ContainerBreadcrumb = () => {
  const router = useRouter();
  const location = useLocation();

  const breadcrumbComponent = useMemo(() => {
    const matches = router.matchRoutes(location.href);
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      if (match?.context && 'breadcrumb' in match.context) {
        return match.context.breadcrumb;
      }
    }

    return null;
  }, [router, location.href]);

  if (!breadcrumbComponent) {
    return null;
  }

  return <Breadcrumb>{breadcrumbComponent}</Breadcrumb>;
};
