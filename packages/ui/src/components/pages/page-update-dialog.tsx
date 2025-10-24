import { LocalPageNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { PageForm } from '@colanode/ui/components/pages/page-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

interface PageUpdateDialogProps {
  page: LocalPageNode;
  role: NodeRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PageUpdateDialog = ({
  page,
  role,
  open,
  onOpenChange,
}: PageUpdateDialogProps) => {
  const workspace = useWorkspace();
  const canEdit = hasNodeRole(role, 'editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update page</DialogTitle>
          <DialogDescription>Update the page name and icon</DialogDescription>
        </DialogHeader>
        <PageForm
          id={page.id}
          values={{
            name: page.attributes.name,
            avatar: page.attributes.avatar,
          }}
          isPending={false}
          submitText="Update"
          readOnly={!canEdit}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            const nodes = database.workspace(workspace.userId).nodes;
            if (!nodes.has(page.id)) {
              return;
            }

            nodes.update(page.id, (draft) => {
              if (draft.attributes.type !== 'page') {
                return;
              }

              draft.attributes.name = values.name;
              draft.attributes.avatar = values.avatar;
            });

            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
