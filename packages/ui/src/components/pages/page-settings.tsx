import { Copy, Image, LetterText, Settings, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';

import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { NodeCollaboratorAudit } from '@colanode/ui/components/collaborators/node-collaborator-audit';
import { PageDeleteDialog } from '@colanode/ui/components/pages/page-delete-dialog';
import { PageUpdateDialog } from '@colanode/ui/components/pages/page-update-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';

interface PageSettingsProps {
  page: LocalPageNode;
  role: NodeRole;
}

export const PageSettings = ({ page, role }: PageSettingsProps) => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteModal] = useState(false);

  const canEdit = hasNodeRole(role, 'editor');
  const canDelete = hasNodeRole(role, 'editor');

  return (
    <Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Settings className="size-4 cursor-pointer text-muted-foreground hover:text-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="mr-2 w-80">
          <DropdownMenuLabel>{page.attributes.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (!canEdit) {
                return;
              }

              setShowUpdateDialog(true);
            }}
            disabled={!canEdit}
          >
            <LetterText className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            disabled={!canEdit}
            onClick={() => {
              if (!canEdit) {
                return;
              }

              setShowUpdateDialog(true);
            }}
          >
            <Image className="size-4" />
            Update icon
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            disabled
          >
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
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Created by</DropdownMenuLabel>
          <DropdownMenuItem>
            <NodeCollaboratorAudit
              collaboratorId={page.createdBy}
              date={page.createdAt}
            />
          </DropdownMenuItem>
          {page.updatedBy && page.updatedAt && (
            <Fragment>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Last updated by</DropdownMenuLabel>
              <DropdownMenuItem>
                <NodeCollaboratorAudit
                  collaboratorId={page.updatedBy}
                  date={page.updatedAt}
                />
              </DropdownMenuItem>
            </Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <PageDeleteDialog
        pageId={page.id}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteModal}
      />
      <PageUpdateDialog
        page={page}
        role={role}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
      />
    </Fragment>
  );
};
