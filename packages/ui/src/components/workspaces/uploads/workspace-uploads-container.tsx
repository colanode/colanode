import { useLiveInfiniteQuery } from '@tanstack/react-db';
import { InView } from 'react-intersection-observer';

import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceUploadFile } from '@colanode/ui/components/workspaces/uploads/workspace-upload-file';
import { WorkspaceUploadsBreadcrumb } from '@colanode/ui/components/workspaces/uploads/workspace-uploads-breadcrumb';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const UPLOADS_PER_PAGE = 100;

export const WorkspaceUploadsContainer = () => {
  const workspace = useWorkspace();

  const uploadsQuery = useLiveInfiniteQuery(
    (q) =>
      q
        .from({ uploads: workspace.collections.uploads })
        .orderBy(({ uploads }) => uploads.fileId, 'desc'),
    {
      pageSize: UPLOADS_PER_PAGE,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === UPLOADS_PER_PAGE ? allPages.length : undefined,
    },
    [workspace.userId]
  );

  const uploads = uploadsQuery.data;

  return (
    <Container type="full" breadcrumb={<WorkspaceUploadsBreadcrumb />}>
      <div className="overflow-y-auto">
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
              if (inView && uploads.length === UPLOADS_PER_PAGE) {
                uploadsQuery.fetchNextPage();
              }
            }}
          />
        </div>
      </div>
    </Container>
  );
};
