import { LocalFileNode } from '@colanode/client/types';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { FileSidebar } from '@colanode/ui/components/files/file-sidebar';

interface FileBodyProps {
  file: LocalFileNode;
}

export const FileBody = ({ file }: FileBodyProps) => {
  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex w-full max-w-full flex-grow items-center justify-center overflow-hidden p-10">
        <FilePreview file={file} />
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-gray-100 p-2 pl-3">
        <FileSidebar file={file} />
      </div>
    </div>
  );
};
