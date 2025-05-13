import { LocalFolderNode } from '@colanode/client/types';

import { FolderNotFound } from '@/renderer/components/folders/folder-not-found';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { useNodeRadar } from '@/renderer/hooks/use-node-radar';
import { FolderSettings } from '@/renderer/components/folders/folder-settings';
import { FolderBody } from '@/renderer/components/folders/folder-body';

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
