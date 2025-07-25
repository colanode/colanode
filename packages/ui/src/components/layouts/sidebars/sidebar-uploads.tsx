import { CloudUpload } from 'lucide-react';

import { SpecialContainerTabPath, UploadStatus } from '@colanode/client/types';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const SidebarUploads = () => {
  const workspace = useWorkspace();
  const layout = useLayout();

  const uploadsQuery = useLiveQuery({
    type: 'upload.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: 1,
    count: 10,
  });

  const uploads = uploadsQuery.data ?? [];
  const pendingUploads = uploads.filter(
    (upload) => upload.status === UploadStatus.Pending
  );
  const pendingUploadsCount = pendingUploads.length;

  if (pendingUploadsCount === 0) {
    return null;
  }

  return (
    <div
      className="w-10 h-10 flex items-center justify-center rounded-md relative cursor-pointer hover:bg-gray-200"
      onClick={() => {
        layout.previewLeft(SpecialContainerTabPath.WorkspaceUploads);
      }}
    >
      <CloudUpload className="size-5 text-primary" />
      <span className="rounded-md px-1.5 py-0.5 text-xs bg-blue-500 text-white absolute top-0 -right-1">
        {pendingUploadsCount}
      </span>
    </div>
  );
};
