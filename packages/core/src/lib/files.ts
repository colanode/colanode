import { FileSubtype } from '@colanode/core/types/files';

export const extractFileSubtype = (mimeType: string): FileSubtype => {
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
    return 'pdf';
  }

  return 'other';
};

export const formatBytes = (
  bytes: number | bigint,
  decimals?: number
): string => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const bytesBigInt = BigInt(bytes);
  const k = BigInt(1024);
  const dm = decimals || 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  // Find the largest power of k that's smaller than bytes
  let i = 0;
  let reducedBytes = bytesBigInt;
  while (reducedBytes >= k && i < sizes.length - 1) {
    reducedBytes = reducedBytes / k;
    i++;
  }

  // Convert to decimal representation with proper precision
  const factor = Math.pow(10, dm);
  const value = Number((reducedBytes * BigInt(factor)) / BigInt(factor));

  return `${value.toFixed(dm)} ${sizes[i]}`;
};

const mimeTypeNames: Record<string, string> = {
  'application/msword': 'Word Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'Word Document',
  'application/pdf': 'PDF Document',
  'application/vnd.ms-excel': 'Excel Spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    'Excel Spreadsheet',
  'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'PowerPoint Presentation',
  'application/zip': 'ZIP Archive',
  'application/x-rar-compressed': 'RAR Archive',
  'application/x-tar': 'TAR Archive',
  'application/x-7z-compressed': '7z Archive',
  'application/x-rar': 'RAR Archive',
  'application/x-bzip': 'BZip Archive',
  'application/x-bzip2': 'BZip2 Archive',
  'application/javascript': 'JavaScript File',
  'application/json': 'JSON File',
  'application/xml': 'XML Document',
  'application/x-shockwave-flash': 'Flash Movie',
  'application/rtf': 'RTF Document',
  'application/octet-stream': 'Binary File',
  'application/x-msdownload': 'Windows Executable',

  // Text types
  'text/plain': 'Text File',
  'text/html': 'HTML Document',
  'text/css': 'CSS File',
  'text/csv': 'CSV File',
  'text/javascript': 'JavaScript File',

  // Image types
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/gif': 'GIF Image',
  'image/webp': 'WebP Image',
  'image/tiff': 'TIFF Image',
  'image/svg+xml': 'SVG Image',
  'image/x-icon': 'Icon File',
  'image/bmp': 'Bitmap Image',
  'image/vnd.microsoft.icon': 'Icon File',

  // Audio types
  'audio/midi': 'MIDI Audio',
  'audio/mpeg': 'MP3 Audio',
  'audio/webm': 'WebM Audio',
  'audio/ogg': 'OGG Audio',
  'audio/wav': 'WAV Audio',
  'audio/aac': 'AAC Audio',
  'audio/mp4': 'MP4 Audio',

  // Video types
  'video/x-msvideo': 'AVI Video',
  'video/mp4': 'MP4 Video',
  'video/mpeg': 'MPEG Video',
  'video/webm': 'WebM Video',
  'video/ogg': 'OGG Video',
  'video/quicktime': 'QuickTime Video',
  'video/x-ms-wmv': 'WMV Video',
  'video/x-flv': 'FLV Video',
  'video/x-matroska': 'MKV Video',

  // Custom types or less common
  // Add any custom or less common file types as needed.
};

export const formatMimeType = (mimeType: string) => {
  return mimeTypeNames[mimeType] || 'File';
};
