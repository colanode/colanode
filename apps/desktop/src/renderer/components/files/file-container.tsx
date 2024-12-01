import { extractNodeRole } from '@colanode/core';

import { FileBody } from '@/renderer/components/files/file-body';
import { FileHeader } from '@/renderer/components/files/file-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileContainerProps {
  nodeId: string;
}

export const FileContainer = ({ nodeId }: FileContainerProps) => {
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
  const file = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);

  if (!file || file.type !== 'file' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <FileHeader nodes={nodes} file={file} role={role} />
      <FileBody file={file} />
    </div>
  );
};
