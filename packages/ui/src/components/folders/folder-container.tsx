import { LocalFolderNode } from '@colanode/client/types';
import { FolderBody } from '@colanode/ui/components/folders/folder-body';
import { FolderNotFound } from '@colanode/ui/components/folders/folder-not-found';
import { FolderSettings } from '@colanode/ui/components/folders/folder-settings';
import { ContainerSettings } from '@colanode/ui/components/workspaces/containers/container-settings';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface FolderContainerProps {
  folderId: string;
}

export const FolderContainer = ({ folderId }: FolderContainerProps) => {
  const data = useNodeContainer<LocalFolderNode>(folderId);

  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <FolderNotFound />;
  }

  const { node: folder, role } = data;

  return (
    <>
      <ContainerSettings>
        <FolderSettings folder={folder} role={role} />
      </ContainerSettings>
      <FolderBody folder={folder} role={role} />
    </>
  );
};
