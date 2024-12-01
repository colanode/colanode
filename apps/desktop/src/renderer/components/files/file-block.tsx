import { FilePreview } from '@/renderer/components/files/file-preview';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();

  const { data } = useQuery({
    type: 'node_get',
    nodeId: id,
    userId: workspace.userId,
  });

  if (!data || data.type !== 'file') {
    return null;
  }

  return (
    <div
      className="flex h-72 max-h-72 max-w-128 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-gray-100"
      onClick={() => {
        workspace.openInModal(id);
      }}
    >
      <FilePreview file={data} />
    </div>
  );
};
