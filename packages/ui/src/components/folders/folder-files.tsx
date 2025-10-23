import { eq, useLiveQuery } from '@tanstack/react-db';
import { useNavigate } from '@tanstack/react-router';
import { match } from 'ts-pattern';

import { FolderLayoutType, LocalFileNode } from '@colanode/client/types';
import { GalleryLayout } from '@colanode/ui/components/folders/galleries/gallery-layout';
import { GridLayout } from '@colanode/ui/components/folders/grids/grid-layout';
import { ListLayout } from '@colanode/ui/components/folders/lists/list-layout';
import { FolderContext } from '@colanode/ui/contexts/folder';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

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
  const navigate = useNavigate({ from: '/workspace/$userId' });

  const viewListQuery = useLiveQuery((q) =>
    q
      .from({ nodes: database.workspace(workspace.userId).nodes })
      .where(({ nodes }) => eq(nodes.type, 'file'))
      .where(({ nodes }) => eq(nodes.parentId, id))
      .orderBy(({ nodes }) => nodes.id, 'asc')
  );

  const files = viewListQuery.data.map((node) => node as LocalFileNode) ?? [];

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
            to: '$nodeId',
            params: { nodeId: id },
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
