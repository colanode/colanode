import { eq, useLiveQuery } from '@tanstack/react-db';

import { LocalFileNode } from '@colanode/client/types';
import { FileIcon } from '@colanode/ui/components/files/file-icon';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { Link } from '@colanode/ui/components/ui/link';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { canPreviewFile } from '@colanode/ui/lib/files';

interface FileBlockProps {
  id: string;
}

export const FileBlock = ({ id }: FileBlockProps) => {
  const workspace = useWorkspace();

  const fileGetQuery = useLiveQuery(
    (q) =>
      q
        .from({ files: workspace.collections.files })
        .where(({ files }) => eq(files.id, id))
        .findOne(),
    [workspace.userId, id]
  );

  if (fileGetQuery.isLoading || !fileGetQuery.data) {
    return null;
  }

  const file = fileGetQuery.data as LocalFileNode;
  const canPreview = canPreviewFile(file.subtype);

  return (
    <Link
      from="/workspace/$userId/$nodeId"
      to="modal/$modalNodeId"
      params={{ modalNodeId: id }}
    >
      {canPreview ? (
        <div className="flex h-72 max-h-72 max-w-lg w-full cursor-pointer overflow-hidden rounded-md p-2 hover:bg-muted/50 items-center justify-center">
          <FilePreview file={file} />
        </div>
      ) : (
        <div className="flex flex-row gap-4 items-center w-full cursor-pointer overflow-hidden rounded-md p-2 pl-0 hover:bg-accent">
          <FileIcon mimeType={file.mimeType} className="size-10" />
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{file.mimeType}</div>
          </div>
        </div>
      )}
    </Link>
  );
};
