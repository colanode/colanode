import { NodeRole, hasNodeRole } from '@colanode/core';
import { LocalPageNode } from '@colanode/client/types';

import { PageForm } from '@/renderer/components/pages/page-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

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
            name: page.attributes.name,
            avatar: page.attributes.avatar,
          }}
          isPending={isPending}
          submitText="Update"
          readOnly={!canEdit}
          handleCancel={() => {
            onOpenChange(false);
          }}
          handleSubmit={(values) => {
            if (isPending) {
              return;
            }

            mutate({
              input: {
                type: 'page_update',
                pageId: page.id,
                name: values.name,
                avatar: values.avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onSuccess() {
                onOpenChange(false);
                toast({
                  title: 'Page updated',
                  description: 'Page was updated successfully',
                  variant: 'default',
                });
              },
              onError(error) {
                toast({
                  title: 'Failed to update page',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
