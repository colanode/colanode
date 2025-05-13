import { LocalFileNode } from '@colanode/client/types';

import { FileBody } from '@/renderer/components/files/file-body';
import {
  Container,
  ContainerBody,
  ContainerHeader,
  ContainerSettings,
} from '@/renderer/components/ui/container';
import { ContainerBreadcrumb } from '@/renderer/components/layouts/containers/container-breadrumb';
import { FileNotFound } from '@/renderer/components/files/file-not-found';
import { useNodeContainer } from '@/renderer/hooks/use-node-container';
import { FileSettings } from '@/renderer/components/files/file-settings';

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
