import { useEffect, useRef } from 'react';

import { DownloadStatus, DownloadType } from '@colanode/client/types';
import { useApp } from '@colanode/ui/contexts/app';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export type FileAvailable = {
  type: 'available';
  url: string;
};

export type FileDownloading = {
  type: 'downloading';
  progress: number;
};

export type FileUnavailable = {
  type: 'unavailable';
};

export type UseFileUrlResult =
  | FileAvailable
  | FileDownloading
  | FileUnavailable;

export const useFileUrl = (
  fileId: string,
  initDownload: boolean = false
): UseFileUrlResult => {
  const app = useApp();
  const workspace = useWorkspace();
  const downloadInitiated = useRef(false);

  const fileQuery = useLiveQuery({
    type: 'file.get',
    id: fileId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const fileDownloadQuery = useLiveQuery(
    {
      type: 'download.get.last',
      fileId,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      downloadType: DownloadType.Auto,
    },
    {
      enabled: !fileQuery.isPending && fileQuery.data === null,
    }
  );

  const isDownloading =
    fileDownloadQuery.data?.status === DownloadStatus.Pending;

  const blobUrlQuery = useLiveQuery(
    {
      type: 'blob.url.get',
      path: fileDownloadQuery.data?.path ?? '',
    },
    {
      enabled: app.type === 'web' && fileQuery.data !== null,
    }
  );

  useEffect(() => {
    if (!initDownload || downloadInitiated.current) {
      return;
    }

    if (fileQuery.isPending || fileQuery.data !== null) {
      return;
    }

    if (!fileDownloadQuery.isPending && !isDownloading) {
      downloadInitiated.current = true;
      window.colanode.executeMutation({
        type: 'file.download',
        fileId,
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        path: null,
      });
    }
  }, [initDownload, fileQuery, isDownloading, fileDownloadQuery]);

  if (isDownloading) {
    return {
      type: 'downloading',
      progress: fileDownloadQuery.data?.progress ?? 0,
    };
  }

  if (fileQuery.data === null) {
    return {
      type: 'unavailable',
    };
  }

  if (app.type === 'desktop') {
    return {
      type: 'available',
      url: `local://files/${workspace.accountId}/${workspace.id}/${fileId}`,
    };
  }

  if (blobUrlQuery.data) {
    return {
      type: 'available',
      url: blobUrlQuery.data,
    };
  }

  return {
    type: 'unavailable',
  };
};
