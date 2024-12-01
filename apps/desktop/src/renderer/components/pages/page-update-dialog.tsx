import { useWorkspace } from '@/renderer/contexts/workspace';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { hasEditorAccess, NodeRole, PageNode } from '@colanode/core';
import { toast } from '@/renderer/hooks/use-toast';
import { PageForm } from '@/renderer/components/pages/page-form';

interface PageUpdateDialogProps {
  page: PageNode;
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
  const canEdit = hasEditorAccess(role);

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
                userId: workspace.userId,
              },
              onSuccess() {
                onOpenChange(false);
                toast({
                  title: 'Page updated',
                  description: 'Page was updated successfully',
                  variant: 'default',
                });
              },
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
