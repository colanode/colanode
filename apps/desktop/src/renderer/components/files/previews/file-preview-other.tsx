import { FileIcon } from '@/renderer/components/files/file-icon';
import { getFriendlyNameFromMimeType } from '@/shared/lib/files';

interface FilePreviewOtherProps {
  mimeType: string;
}

export const FilePreviewOther = ({ mimeType }: FilePreviewOtherProps) => {
  const friendlyName = getFriendlyNameFromMimeType(mimeType);

  return (
    <div className="flex flex-col items-center gap-3">
      <FileIcon mimeType={mimeType} className="h-10 w-10" />
      <p className="text-sm text-muted-foreground">
        No preview available for {friendlyName}
      </p>
    </div>
  );
};
