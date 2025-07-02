import { DownloadsBreadcrumb } from '@colanode/ui/components/downloads/downloads-breadcrumb';
import { DownloadsList } from '@colanode/ui/components/downloads/downloads-list';
import {
  Container,
  ContainerBody,
  ContainerHeader,
} from '@colanode/ui/components/ui/container';

export const DownloadsContainer = () => {
  return (
    <Container>
      <ContainerHeader>
        <DownloadsBreadcrumb />
      </ContainerHeader>
      <ContainerBody>
        <DownloadsList />
      </ContainerBody>
    </Container>
  );
};
