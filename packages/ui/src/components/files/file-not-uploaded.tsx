import { FileIcon } from '@colanode/ui/components/files/file-icon';

interface FileNotUploadedProps {
  mimeType: string;
}

export const FileNotUploaded = ({ mimeType }: FileNotUploadedProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <FileIcon mimeType={mimeType} className="h-10 w-10" />
      <p className="text-sm text-muted-foreground text-center">
        The file has not been fully uploaded by the author yet.
        <br /> You will be able to preview or download it once it is fully
        uploaded.
      </p>
    </div>
  );
};
