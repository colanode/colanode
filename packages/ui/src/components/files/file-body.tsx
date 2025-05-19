import { SquareArrowOutUpRight } from 'lucide-react';

import { LocalFileNode } from '@colanode/client/types';
import { FilePreview } from '@colanode/ui/components/files/file-preview';
import { FileSidebar } from '@colanode/ui/components/files/file-sidebar';
import { Button } from '@colanode/ui/components/ui/button';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface FileBodyProps {
  file: LocalFileNode;
}

export const FileBody = ({ file }: FileBodyProps) => {
  const workspace = useWorkspace();

  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex h-full max-h-full w-full max-w-full flex-grow flex-col items-center justify-center overflow-hidden">
        <div className="mr-2 flex w-full flex-row justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.colanode.executeCommand({
                type: 'file_open',
                accountId: workspace.accountId,
                workspaceId: workspace.id,
                fileId: file.id,
                extension: file.attributes.extension,
              })
            }
          >
            <SquareArrowOutUpRight className="mr-1 size-4" /> Open
          </Button>
        </div>
        <div className="flex w-full max-w-full flex-grow items-center justify-center overflow-hidden p-10">
          <FilePreview file={file} />
        </div>
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-gray-100 p-2 pl-3">
        <FileSidebar file={file} />
      </div>
    </div>
  );
};
