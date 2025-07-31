import { useState } from 'react';
import { InView } from 'react-intersection-observer';

import { UploadListQueryInput } from '@colanode/client/queries';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceUploadFile } from '@colanode/ui/components/workspaces/uploads/workspace-upload-file';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQueries } from '@colanode/ui/hooks/use-live-queries';

const UPLOADS_PER_PAGE = 100;

export const WorkspaceUploads = () => {
  const workspace = useWorkspace();

  const [lastPage, setLastPage] = useState<number>(1);
  const inputs: UploadListQueryInput[] = Array.from({
    length: lastPage,
  }).map((_, i) => ({
    type: 'upload.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    count: UPLOADS_PER_PAGE,
    page: i + 1,
  }));

  const result = useLiveQueries(inputs);
  const uploads = result.flatMap((data) => data.data ?? []);

  const isPending = result.some((data) => data.isPending);
  const hasMore = !isPending && uploads.length === lastPage * UPLOADS_PER_PAGE;

  return (
    <Container>
      <ContainerBody className="overflow-y-auto">
        <div className="max-w-4xl space-y-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Uploads</h2>
            <Separator className="mt-3" />
          </div>
          <div className="space-y-4 w-full">
            {uploads.map((upload) => (
              <WorkspaceUploadFile key={upload.fileId} upload={upload} />
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
