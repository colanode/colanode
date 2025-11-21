import { toast } from 'sonner';

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
import { useMutation } from '@colanode/ui/hooks/use-mutation';

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
  const { mutate, isPending } = useMutation();
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
            name: page.name,
            avatar: page.avatar,
          }}
          submitText="Update"
          readOnly={!canEdit}
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'page.update',
                pageId: page.id,
                name: values.name,
                avatar: values.avatar,
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
                toast.success('Page was updated successfully');
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
