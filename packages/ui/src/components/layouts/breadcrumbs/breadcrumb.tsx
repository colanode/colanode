import { useEffect } from 'react';

import { useContainer } from '@colanode/ui/contexts/container';

interface BreadcrumbProps {
  children: React.ReactNode;
}

export const Breadcrumb = ({ children }: BreadcrumbProps) => {
  const container = useContainer();

  useEffect(() => {
    container.setBreadcrumb(children);

    return () => {
      container.resetBreadcrumb();
    };
  }, [children]);

  return null;
};
