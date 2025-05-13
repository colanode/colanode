import { FileSubtype } from '@colanode/core';

export type FileMetadata = {
  path: string;
  mimeType: string;
  extension: string;
  name: string;
  size: number;
  type: FileSubtype;
};

export type FileState = {
  id: string;
  version: string;
  downloadStatus: DownloadStatus | null;
  downloadProgress: number | null;
  downloadRetries: number | null;
  downloadStartedAt: string | null;
  downloadCompletedAt: string | null;
  uploadStatus: UploadStatus | null;
  uploadProgress: number | null;
  uploadRetries: number | null;
  uploadStartedAt: string | null;
  uploadCompletedAt: string | null;
};

export enum DownloadStatus {
  None = 0,
  Pending = 1,
  Completed = 2,
  Failed = 3,
}

export enum UploadStatus {
  None = 0,
  Pending = 1,
  Completed = 2,
  Failed = 3,
}
