import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Copy, Settings, Trash2 } from 'lucide-react';
import { hasEditorAccess, NodeRole, RecordNode } from '@colanode/core';
import { NodeCollaboratorAudit } from '@/renderer/components/collaborators/node-collaborator-audit';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { RecordDeleteDialog } from '@/renderer/components/records/record-delete-dialog';

interface RecordSettingsProps {
  record: RecordNode;
  role: NodeRole;
}

export const RecordSettings = ({ record, role }: RecordSettingsProps) => {
  const workspace = useWorkspace();
  const [showDeleteDialog, setShowDeleteModal] = React.useState(false);
  const canDelete =
    record.createdBy === workspace.userId || hasEditorAccess(role);

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-80">
          <DropdownMenuLabel>{record.attributes.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
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
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Created by</DropdownMenuLabel>
          <DropdownMenuItem>
            <NodeCollaboratorAudit
              collaboratorId={record.createdBy}
              date={record.createdAt}
            />
          </DropdownMenuItem>
          {record.updatedBy && (
            <React.Fragment>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Last updated by</DropdownMenuLabel>
              <DropdownMenuItem>
                <NodeCollaboratorAudit
                  collaboratorId={record.updatedBy}
                  date={record.updatedAt}
                />
              </DropdownMenuItem>
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RecordDeleteDialog
        nodeId={record.id}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteModal}
      />
    </React.Fragment>
  );
};
