import { LocalSpaceNode } from '@colanode/client/types';
import { Breadcrumb } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { SpaceBody } from '@colanode/ui/components/spaces/space-body';
import { SpaceNotFound } from '@colanode/ui/components/spaces/space-not-found';
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
    <>
      <Breadcrumb>
        <NodeBreadcrumb breadcrumb={data.breadcrumb} />
      </Breadcrumb>
      <SpaceBody space={node} role={role} />
    </>
  );
};
