import { useState } from 'react';
import { InView } from 'react-intersection-observer';

import { DownloadListManualQueryInput } from '@colanode/client/queries';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceDownloadFile } from '@colanode/ui/components/workspaces/downloads/workspace-download-file';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQueries } from '@colanode/ui/hooks/use-live-queries';

const DOWNLOADS_PER_PAGE = 100;

export const WorkspaceDownloads = () => {
  const workspace = useWorkspace();

  const [lastPage, setLastPage] = useState<number>(1);
  const inputs: DownloadListManualQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'download.list.manual',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    count: DOWNLOADS_PER_PAGE,
    page: i + 1,
  }));

  const result = useLiveQueries(inputs);
  const downloads = result.flatMap((data) => data.data ?? []);

  const isPending = result.some((data) => data.isPending);
  const hasMore =
    !isPending && downloads.length === lastPage * DOWNLOADS_PER_PAGE;

  return (
    <Container>
      <ContainerBody className="overflow-y-auto">
        <div className="max-w-4xl space-y-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Downloads</h2>
            <Separator className="mt-3" />
          </div>
          <div className="space-y-4 w-full">
            {downloads.map((download) => (
              <WorkspaceDownloadFile key={download.id} download={download} />
            ))}
          </div>
          <InView
            rootMargin="200px"
            onChange={(inView) => {
              if (inView && hasMore && !isPending) {
                setLastPage(lastPage + 1);
              }
            }}
          />
        </div>
      </ContainerBody>
    </Container>
  );
};
