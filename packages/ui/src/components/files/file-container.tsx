import { LocalFileNode } from '@colanode/client/types';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { FileSaveButton } from '@colanode/ui/components/files/file-save-button';
import { FileSidebar } from '@colanode/ui/components/files/file-sidebar';
import { canPreviewFile } from '@colanode/ui/lib/files';

interface FileContainerProps {
  file: LocalFileNode;
}

export const FileContainer = ({ file }: FileContainerProps) => {
  const canPreview = canPreviewFile(file.subtype);

  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex flex-col w-full max-w-full h-full grow overflow-hidden">
        <div className="flex flex-row w-full items-center justify-end p-4 gap-4">
          <FileSaveButton file={file} />
        </div>

        <div className="flex flex-col grow items-center justify-center overflow-hidden p-10">
          {canPreview ? (
            <FilePreview file={file} />
          ) : (
            <FileNoPreview mimeType={file.mimeType} />
          )}
        </div>
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-border p-2 pl-3">
        <FileSidebar file={file} />
      </div>
    </div>
  );
};
