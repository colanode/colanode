import { LocalFileNode } from '@colanode/client/types';
import { FileContextMenu } from '@colanode/ui/components/files/file-context-menu';
import { FileThumbnail } from '@colanode/ui/components/files/file-thumbnail';
import { GridItem } from '@colanode/ui/components/folders/grids/grid-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface GridFileProps {
  file: LocalFileNode;
}

export const GridFile = ({ file }: GridFileProps) => {
  const workspace = useWorkspace();

  return (
    <FileContextMenu id={file.id}>
      <GridItem id={file.id}>
        <div className="flex w-full justify-center">
          <FileThumbnail
            userId={workspace.userId}
            file={file}
            className="h-14 w-14"
          />
        </div>
        <p
          className="line-clamp-2 w-full wrap-break-word text-center text-xs text-foreground/80"
          title={file.name}
        >
          {file.name}
        </p>
      </GridItem>
    </FileContextMenu>
  );
};
