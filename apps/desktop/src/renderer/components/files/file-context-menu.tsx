import { Folder, Trash2 } from 'lucide-react';
import React from 'react';

import { FileDeleteDialog } from '@/renderer/components/files/file-delete-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/renderer/components/ui/context-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FileContextMenuProps {
  id: string;
  children: React.ReactNode;
}

export const FileContextMenu = ({ id, children }: FileContextMenuProps) => {
  const workspace = useWorkspace();
  const [openDelete, setOpenDelete] = React.useState(false);

  return (
    <React.Fragment>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem
            onSelect={() => {
              workspace.openInModal(id);
            }}
            className="pl-2"
          >
            <ContextMenuShortcut className="ml-0">
              <Folder className="mr-2 size-4" />
            </ContextMenuShortcut>
            Open
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setOpenDelete(true)}
            className="flex items-center gap-x-2 pl-2 text-red-500"
          >
            <ContextMenuShortcut className="ml-0">
              <Trash2 className="size-4 text-red-500" />
            </ContextMenuShortcut>
            <span className="text-red-500">Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <FileDeleteDialog
        nodeId={id}
        open={openDelete}
        onOpenChange={setOpenDelete}
      />
    </React.Fragment>
  );
};
