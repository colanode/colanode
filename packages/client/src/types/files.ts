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
};

export type File = {
  id: string;
  version: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
};

export type Upload = {
  fileId: string;
  status: UploadStatus;
  progress: number;
  retries: number;
  createdAt: string;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export type Download = {
  id: string;
  fileId: string;
  version: string;
  type: DownloadType;
  path: string;
  size: number;
  mimeType: string;
  status: DownloadStatus;
  progress: number;
  retries: number;
  createdAt: string;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
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

export enum DownloadType {
  Auto = 0,
  Manual = 1,
}
