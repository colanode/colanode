import { LocalFileNode } from '@colanode/client/types';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface FileContainerTabProps {
  fileId: string;
}

export const FileContainerTab = ({ fileId }: FileContainerTabProps) => {
  const workspace = useWorkspace();

  const nodeGetQuery = useQuery({
    type: 'node.get',
    nodeId: fileId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const file = nodeGetQuery.data as LocalFileNode;
  if (!file) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  return (
    <div className="flex items-center space-x-2">
      <FileThumbnail file={file} className="size-4 rounded object-contain" />
      <span>{file.attributes.name}</span>
    </div>
  );
};
