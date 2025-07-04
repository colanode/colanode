import { LocalFileNode } from '@colanode/client/types';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { FileSaveButton } from '@colanode/ui/components/files/file-save-button';
import { FileSidebar } from '@colanode/ui/components/files/file-sidebar';

interface FileBodyProps {
  file: LocalFileNode;
}

export const FileBody = ({ file }: FileBodyProps) => {
  const canPreview =
    file.attributes.subtype === 'image' ||
    file.attributes.subtype === 'video' ||
    file.attributes.subtype === 'audio';

  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex w-full max-w-full h-full flex-grow items-center justify-center overflow-hidden p-10 relative">
        <div className="absolute top-4 right-4 z-10">
          <FileSaveButton file={file} />
        </div>

        {canPreview ? (
          <FilePreview file={file} />
        ) : (
          <FileNoPreview mimeType={file.attributes.mimeType} />
        )}
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-gray-100 p-2 pl-3">
        <FileSidebar file={file} />
      </div>
    </div>
  );
};
