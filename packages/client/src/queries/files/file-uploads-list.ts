import { UploadStatus } from '@colanode/client/types/files';

export type FileUploadsListQueryInput = {
  type: 'file.uploads.list';
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

export type FileUploadItem = {
  id: string;
  status: UploadStatus;
  progress: number;
  createdAt: string;
  completedAt: string | null;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.uploads.list': {
      input: FileUploadsListQueryInput;
      output: FileUploadItem[];
    };
  }
}
