import { LocalSpaceNode } from '@colanode/client/types';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { SpaceBody } from '@colanode/ui/components/spaces/space-body';
import { SpaceNotFound } from '@colanode/ui/components/spaces/space-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@colanode/ui/components/ui/container';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface SpaceContainerProps {
  spaceId: string;
}

export const SpaceContainer = ({ spaceId }: SpaceContainerProps) => {
  const data = useNodeContainer<LocalSpaceNode>(spaceId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <SpaceNotFound />;
  }

  const { node, role } = data;

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
      </ContainerHeader>
      <ContainerBody>
        <SpaceBody space={node} role={role} />
      </ContainerBody>
    </Container>
  );
};
