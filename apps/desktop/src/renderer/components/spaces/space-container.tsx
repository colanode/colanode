import { LocalSpaceNode } from '@colanode/client/types';

import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { SpaceNotFound } from '@/renderer/components/spaces/space-not-found';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { SpaceBody } from '@/renderer/components/spaces/space-body';

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
