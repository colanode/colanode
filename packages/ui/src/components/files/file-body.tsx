import { LocalFileNode } from '@colanode/client/types';
import { FileStatus } from '@colanode/core';
import { FileNoPreview } from '@colanode/ui/components/files/file-no-preview';
import { FileNotUploaded } from '@colanode/ui/components/files/file-not-uploaded';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { FileSaveButton } from '@colanode/ui/components/files/file-save-button';
import { FileSidebar } from '@colanode/ui/components/files/file-sidebar';
import { canPreviewFile } from '@colanode/ui/lib/files';

interface FileBodyProps {
  file: LocalFileNode;
}

export const FileBody = ({ file }: FileBodyProps) => {
  const canPreview = canPreviewFile(file.attributes.subtype);
  const isReady = file.attributes.status === FileStatus.Ready;

  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex flex-col w-full max-w-full h-full flex-grow overflow-hidden">
        <div className="flex flex-row w-full items-center justify-end p-4 gap-4">
          <FileSaveButton file={file} />
        </div>

        <div className="flex flex-col flex-grow items-center justify-center overflow-hidden p-10">
          {!isReady ? (
            <FileNotUploaded mimeType={file.attributes.mimeType} />
          ) : canPreview ? (
            <FilePreview file={file} />
          ) : (
            <FileNoPreview mimeType={file.attributes.mimeType} />
          )}
        </div>
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-border p-2 pl-3">
        <FileSidebar file={file} />
      </div>
    </div>
  );
};
