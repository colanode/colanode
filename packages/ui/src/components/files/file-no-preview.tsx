import { formatMimeType } from '@colanode/core';
import { FileIcon } from '@colanode/ui/components/files/file-icon';

interface FileNoPreviewProps {
  mimeType: string;
}

export const FileNoPreview = ({ mimeType }: FileNoPreviewProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <FileIcon mimeType={mimeType} className="h-10 w-10" />
      <p className="text-sm text-muted-foreground">
        No preview available for {formatMimeType(mimeType)}
      </p>
    </div>
  );
};
