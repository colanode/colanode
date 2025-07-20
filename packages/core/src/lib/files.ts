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
  maxDecimals: number = 2
): string => {
  const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;
  const BASE = 1024;

  // Work with a bigint internally to stay safe for very large values.
  let valueBig = typeof bytes === 'bigint' ? bytes : BigInt(bytes);
  let unitIdx = 0;

  // Find the most suitable unit (stop at YB to avoid overflow).
  while (valueBig >= BigInt(BASE) && unitIdx < UNITS.length - 1) {
    valueBig /= BigInt(BASE);
    unitIdx++;
  }

  // Convert the original byte value to a JS number **after** determining the unit,
  // so it is safely within Number’s range for formatting.
  const divisor = Math.pow(BASE, unitIdx);
  const valueNum =
    (typeof bytes === 'bigint' ? Number(bytes) : bytes) / divisor;

  // Round to the requested precision, then trim superfluous zeros.
  const rounded = valueNum.toFixed(maxDecimals);
  const trimmed = rounded.replace(/\.?0+$/, '');

  return `${trimmed} ${UNITS[unitIdx]}`;
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
