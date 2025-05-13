import { Copy, Settings, Trash2 } from 'lucide-react';
import React from 'react';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { LocalFileNode } from '@colanode/client/types';

import { FileDeleteDialog } from '@/renderer/components/files/file-delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FileSettingsProps {
  file: LocalFileNode;
  role: NodeRole;
}

export const FileSettings = ({ file, role }: FileSettingsProps) => {
  const workspace = useWorkspace();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const canDelete =
    file.parentId === file.parentId &&
    (file.createdBy === workspace.userId || hasNodeRole(role, 'editor'));

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-56">
          <DropdownMenuItem className="flex items-center gap-2" disabled>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => {
              if (!canDelete) {
                return;
              }

              setShowDeleteModal(true);
            }}
            disabled={!canDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {canDelete && (
        <FileDeleteDialog
          fileId={file.id}
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
        />
      )}
    </React.Fragment>
  );
};
