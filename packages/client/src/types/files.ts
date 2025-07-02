import { LocalFileNode } from '@colanode/client/types';
import { FileSubtype } from '@colanode/core';

export type OpenFileDialogOptions = {
  accept?: string;
  multiple?: boolean;
};

export type TempFile = {
  id: string;
  name: string;
  path: string;
  size: number;
  type: FileSubtype;
  mimeType: string;
  extension: string;
  url: string;
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
  url: string | null;
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

export enum SaveStatus {
  Active = 1,
  Completed = 2,
  Failed = 3,
}

export type FileSaveState = {
  id: string;
  file: LocalFileNode;
  status: SaveStatus;
  startedAt: string;
  completedAt: string | null;
  path: string;
  progress: number;
};
