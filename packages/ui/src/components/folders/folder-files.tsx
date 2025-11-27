import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { match } from 'ts-pattern';

import { FileListQueryInput } from '@colanode/client/queries';
import { FolderLayoutType } from '@colanode/client/types';
import { GalleryLayout } from '@colanode/ui/components/folders/galleries/gallery-layout';
import { GridLayout } from '@colanode/ui/components/folders/grids/grid-layout';
import { ListLayout } from '@colanode/ui/components/folders/lists/list-layout';
import { FolderContext } from '@colanode/ui/contexts/folder';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQueries } from '@colanode/ui/hooks/use-live-queries';

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
  const navigate = useNavigate({ from: '/workspace/$userId/$nodeId' });

  const [lastPage] = useState<number>(1);
  const inputs: FileListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'file.list',
    userId: workspace.userId,
    parentId: id,
    count: FILES_PER_PAGE,
    page: i + 1,
  }));

  const result = useLiveQueries(inputs);
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
          navigate({
            to: 'modal/$modalNodeId',
            params: { modalNodeId: id },
          });
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
