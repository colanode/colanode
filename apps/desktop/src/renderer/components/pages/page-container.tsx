import { LocalPageNode } from '@colanode/client/types';

import { PageNotFound } from '@/renderer/components/pages/page-not-found';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import { PageSettings } from '@/renderer/components/pages/page-settings';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { PageBody } from '@/renderer/components/pages/page-body';

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
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <PageSettings page={page} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <PageBody page={page} role={role} />
      </ContainerBody>
    </Container>
  );
};
