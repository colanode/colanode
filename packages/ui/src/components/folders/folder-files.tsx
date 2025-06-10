import { useState } from 'react';
import { match } from 'ts-pattern';

import { FileListQueryInput } from '@colanode/client/queries';
import { FolderLayoutType } from '@colanode/client/types';
import { GalleryLayout } from '@colanode/ui/components/folders/galleries/gallery-layout';
import { GridLayout } from '@colanode/ui/components/folders/grids/grid-layout';
import { ListLayout } from '@colanode/ui/components/folders/lists/list-layout';
import { FolderContext } from '@colanode/ui/contexts/folder';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQueries } from '@colanode/ui/hooks/use-queries';

const FILES_PER_PAGE = 100;

interface FolderFilesProps {
  id: string;
  name: string;
  layout: FolderLayoutType;
}

export const FolderFiles = ({
  id,
  name,
  layout: folderLayout,
}: FolderFilesProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const [lastPage] = useState<number>(1);
  const inputs: FileListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'file.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    parentId: id,
    count: FILES_PER_PAGE,
    page: i + 1,
  }));

  const result = useQueries(inputs);
  const files = result.flatMap((data) => data.data ?? []);

  return (
    <FolderContext.Provider
      value={{
        id,
        name,
        files,
        onClick: () => {
          console.log('onClick');
        },
        onDoubleClick: (_, id) => {
          layout.previewLeft(id, true);
        },
        onMove: () => {},
      }}
    >
      {match(folderLayout)
        .with('grid', () => <GridLayout />)
        .with('list', () => <ListLayout />)
        .with('gallery', () => <GalleryLayout />)
        .exhaustive()}
    </FolderContext.Provider>
  );
};
