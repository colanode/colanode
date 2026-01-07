import { Copy, Settings, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { LocalFileNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { NodeDeleteDialog } from '@colanode/ui/components/nodes/node-delete-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface FileSettingsProps {
  file: LocalFileNode;
  role: NodeRole;
}

export const FileSettings = ({ file, role }: FileSettingsProps) => {
  const workspace = useWorkspace();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const canDelete =
    file.parentId === file.parentId &&
    (file.createdBy === workspace.userId || hasNodeRole(role, 'editor'));

  return (
    <Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-4 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-56">
          <DropdownMenuItem className="flex items-center gap-2" disabled>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
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
        <NodeDeleteDialog
          id={file.id}
          title="Are you sure you want delete this file?"
          description="This action cannot be undone. This file will no longer be accessible and all data in the file will be lost."
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
        />
      )}
    </Fragment>
  );
};
