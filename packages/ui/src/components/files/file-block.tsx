import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { canPreviewFile } from '@colanode/ui/lib/files';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();

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
      <Link
        from="/acc/$accountId/$workspaceId"
        to="$nodeId"
        params={{ nodeId: id }}
        className="flex h-72 max-h-72 max-w-128 w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-muted/50"
      >
        <FilePreview file={file} />
      </Link>
    );
  }

  return (
    <Link
      from="/acc/$accountId/$workspaceId"
      to="$nodeId"
      params={{ nodeId: id }}
      className="flex flex-row gap-4 items-center w-full cursor-pointer overflow-hidden rounded-md p-2 pl-0 hover:bg-accent"
    >
      <FileIcon mimeType={file.attributes.mimeType} className="size-10" />
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{file.attributes.name}</div>
        <div className="text-xs text-muted-foreground">
          {file.attributes.mimeType}
        </div>
      </div>
    </Link>
  );
};
