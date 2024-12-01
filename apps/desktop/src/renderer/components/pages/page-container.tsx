import { extractNodeRole } from '@colanode/core';

import { PageBody } from '@/renderer/components/pages/page-body';
import { PageHeader } from '@/renderer/components/pages/page-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface PageContainerProps {
  nodeId: string;
}

export const PageContainer = ({ nodeId }: PageContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_tree_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const nodes = data ?? [];
  const page = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!page || page.type !== 'page' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader nodes={nodes} page={page} role={role} />
      <PageBody page={page} role={role} />
    </div>
  );
};
