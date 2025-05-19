import { LocalPageNode } from '@colanode/client/types';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { PageBody } from '@colanode/ui/components/pages/page-body';
import { PageNotFound } from '@colanode/ui/components/pages/page-not-found';
import { PageSettings } from '@colanode/ui/components/pages/page-settings';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
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
