import { FileType } from '../types/files';

export const extractFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType.startsWith('application/pdf')) {
    return 'document';
  }

  return 'other';
};
