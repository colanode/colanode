import { LocalPageNode } from '@colanode/client/types';
import { Breadcrumb } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb';
import { ContainerSettings } from '@colanode/ui/components/layouts/containers/container-settings';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { PageBody } from '@colanode/ui/components/pages/page-body';
import { PageNotFound } from '@colanode/ui/components/pages/page-not-found';
import { PageSettings } from '@colanode/ui/components/pages/page-settings';
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
      <Breadcrumb>
        <NodeBreadcrumb breadcrumb={data.breadcrumb} />
      </Breadcrumb>
      <ContainerSettings>
        <PageSettings page={page} role={role} />
      </ContainerSettings>
      <PageBody page={page} role={role} />
    </>
  );
};
