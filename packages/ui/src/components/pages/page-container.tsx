import { LocalPageNode } from '@colanode/client/types';
import { PageBody } from '@colanode/ui/components/pages/page-body';
import { PageNotFound } from '@colanode/ui/components/pages/page-not-found';
import { PageSettings } from '@colanode/ui/components/pages/page-settings';
import { ContainerSettings } from '@colanode/ui/components/workspaces/containers/container-settings';
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

  return (
    <>
      <ContainerSettings>
        <PageSettings page={page} role={role} />
      </ContainerSettings>
      <PageBody page={page} role={role} />
    </>
  );
};
