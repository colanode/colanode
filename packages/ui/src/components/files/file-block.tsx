import { LocalFileNode } from '@colanode/client/types';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const { data } = useQuery({
    type: 'node_get',
    nodeId: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!data) {
    return null;
  }

  const file = data as LocalFileNode;

  return (
    <div
      className="flex h-72 max-h-72 max-w-128 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
      onClick={() => {
        layout.previewLeft(id, true);
      }}
    >
      <FilePreview file={file} />
    </div>
  );
};
