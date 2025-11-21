import { eq, useLiveInfiniteQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { match } from 'ts-pattern';

import { FolderLayoutType } from '@colanode/client/types';
import { GalleryLayout } from '@colanode/ui/components/folders/galleries/gallery-layout';
import { GridLayout } from '@colanode/ui/components/folders/grids/grid-layout';
import { ListLayout } from '@colanode/ui/components/folders/lists/list-layout';
import { FolderContext } from '@colanode/ui/contexts/folder';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

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

  const fileListQuery = useLiveInfiniteQuery(
    (q) =>
      q
        .from({ files: workspace.collections.files })
        .where(({ files }) => eq(files.parentId, id))
        .orderBy(({ files }) => files.id, 'asc'),
    {
      pageSize: FILES_PER_PAGE,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === FILES_PER_PAGE ? allPages.length : undefined,
    },
    [workspace.userId, id]
  );

  const files = fileListQuery.data;

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
