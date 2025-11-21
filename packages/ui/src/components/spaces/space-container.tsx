import { toast } from 'sonner';

import { LocalSpaceNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { NodeCollaborators } from '@colanode/ui/components/collaborators/node-collaborators';
import { SpaceDelete } from '@colanode/ui/components/spaces/space-delete';
import { SpaceForm } from '@colanode/ui/components/spaces/space-form';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface SpaceContainerProps {
  space: LocalSpaceNode;
  role: NodeRole;
}

export const SpaceContainer = ({ space, role }: SpaceContainerProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const canEdit = hasNodeRole(role, 'admin');
  const canDelete = hasNodeRole(role, 'admin');

  return (
    <div className="max-w-4xl space-y-8 w-full pb-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">General</h2>
          <Separator className="mt-3" />
        </div>
        <SpaceForm
          values={{
            name: space.name,
            description: space.description ?? '',
            avatar: space.avatar ?? null,
          }}
          readOnly={!canEdit}
          onSubmit={(values) => {
            mutate({
              input: {
                type: 'space.update',
                userId: workspace.userId,
                spaceId: space.id,
                name: values.name,
                description: values.description,
                avatar: values.avatar,
              },
              onSuccess() {
                toast.success('Space updated');
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
          submitText="Update"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Collaborators
          </h2>
          <Separator className="mt-3" />
        </div>
        <NodeCollaborators node={space} nodes={[space]} role={role} />
      </div>

      {canDelete && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Danger Zone
            </h2>
            <Separator className="mt-3" />
          </div>
          <SpaceDelete spaceId={space.id} />
        </div>
      )}
    </div>
  );
};
