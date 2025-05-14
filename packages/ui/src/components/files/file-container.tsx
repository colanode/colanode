import { LocalFileNode } from '@colanode/client/types';
import { FileBody } from '@colanode/ui/components/files/file-body';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@colanode/ui/components/ui/container';
import { ContainerBreadcrumb } from '@colanode/ui/components/layouts/containers/container-breadrumb';
import { FileNotFound } from '@colanode/ui/components/files/file-not-found';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { FileSettings } from '@colanode/ui/components/files/file-settings';

interface FileContainerProps {
  fileId: string;
}

export const FileContainer = ({ fileId }: FileContainerProps) => {
  const data = useNodeContainer<LocalFileNode>(fileId);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <FileNotFound />;
  }

  return (
    <Container>
      <ContainerHeader>
        <ContainerBreadcrumb breadcrumb={data.breadcrumb} />
        <ContainerSettings>
          <FileSettings file={data.node} role={data.role} />
        </ContainerSettings>
      </ContainerHeader>
      <ContainerBody>
        <FileBody file={data.node} />
      </ContainerBody>
    </Container>
  );
};
