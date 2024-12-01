import { FileNode } from '@colanode/core';

import { FileContextMenu } from '@/renderer/components/files/file-context-menu';
import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { GridItem } from '@/renderer/components/folders/grids/grid-item';

interface GridFileProps {
  file: FileNode;
}

export const GridFile = ({ file }: GridFileProps) => {
  return (
    <FileContextMenu id={file.id}>
      <GridItem id={file.id}>
        <div className="flex w-full justify-center">
          <FileThumbnail file={file} className="h-14 w-14" />
        </div>
        <p
          className="line-clamp-2 w-full break-words text-center text-xs text-foreground/80"
          title={file.attributes.name}
        >
          {file.attributes.name}
        </p>
      </GridItem>
    </FileContextMenu>
  );
};
