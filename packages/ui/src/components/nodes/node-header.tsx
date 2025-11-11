import { LocalNode } from '@colanode/client/types';
import { NodeBreadcrumb } from '@colanode/ui/components/nodes/node-breadcrumb';
import { NodeSettings } from '@colanode/ui/components/nodes/node-settings';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';

interface NodeHeaderProps {
  nodeId: string;
}

export const NodeHeader = ({ nodeId }: NodeHeaderProps) => {
  const data = useNodeContainer<LocalNode>(nodeId);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <NodeBreadcrumb nodes={data.breadcrumb} />
      <NodeSettings node={data.node} role={data.role} />
    </div>
  );
};
