import { LocalFolderNode } from '@colanode/client/types';
import { FolderBody } from '@colanode/ui/components/folders/folder-body';
import { FolderNotFound } from '@colanode/ui/components/folders/folder-not-found';
import { FolderSettings } from '@colanode/ui/components/folders/folder-settings';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
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
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <FolderSettings folder={folder} role={role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <FolderBody folder={folder} role={role} />
      </ContainerBody>
    </Container>
  );
};
