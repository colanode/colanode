import { LocalSpaceNode } from '@colanode/client/types';
import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@colanode/ui/components/ui/container';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { SpaceNotFound } from '@colanode/ui/components/spaces/space-not-found';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { SpaceBody } from '@colanode/ui/components/spaces/space-body';

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
