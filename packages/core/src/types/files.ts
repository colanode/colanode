export type CreateUploadInput = {
  fileId: string;
  uploadId: string;
};

export type UploadMetadata = {
  fileId: string;
  uploadId: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type CreateUploadOutput = {
  uploadId: string;
  url: string;
};

export type CreateDownloadOutput = {
  url: string;
};

export type CompleteUploadOutput = {
  success: boolean;
};

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other';
