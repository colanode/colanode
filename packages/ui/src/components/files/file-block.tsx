import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { canPreviewFile } from '@colanode/ui/lib/files';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const nodeGetQuery = useLiveQuery({
    type: 'node.get',
    nodeId: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (nodeGetQuery.isPending || !nodeGetQuery.data) {
    return null;
  }

  const file = nodeGetQuery.data as LocalFileNode;
  const canPreview = canPreviewFile(file.attributes.subtype);

  if (canPreview) {
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
  }

  return (
    <div
      className="flex flex-row gap-4 items-center w-full cursor-pointer overflow-hidden rounded-md p-2 pl-0 hover:bg-gray-100"
      onClick={() => {
        layout.previewLeft(id, true);
      }}
    >
      <FileIcon mimeType={file.attributes.mimeType} className="size-10" />
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{file.attributes.name}</div>
        <div className="text-xs text-gray-500">{file.attributes.mimeType}</div>
      </div>
    </div>
  );
};
