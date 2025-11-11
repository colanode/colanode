import { LocalPageNode } from '@colanode/client/types';
import { PageBody } from '@colanode/ui/components/pages/page-body';
import { PageNotFound } from '@colanode/ui/components/pages/page-not-found';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface PageContainerProps {
  pageId: string;
}

export const PageContainer = ({ pageId }: PageContainerProps) => {
  const data = useNodeContainer<LocalPageNode>(pageId);
  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <PageNotFound />;
  }

  const { node: page, role } = data;

  return <PageBody page={page} role={role} />;
};
