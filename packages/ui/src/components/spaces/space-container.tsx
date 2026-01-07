import { LocalSpaceNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { NodeCollaborators } from '@colanode/ui/components/collaborators/node-collaborators';
import { SpaceDelete } from '@colanode/ui/components/spaces/space-delete';
import {
  SpaceForm,
  SpaceFormValues,
} from '@colanode/ui/components/spaces/space-form';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface SpaceContainerProps {
  space: LocalSpaceNode;
  role: NodeRole;
}

export const SpaceContainer = ({ space, role }: SpaceContainerProps) => {
  const workspace = useWorkspace();

  const canEdit = hasNodeRole(role, 'admin');
  const canDelete = hasNodeRole(role, 'admin');

  const handleSubmit = (values: SpaceFormValues) => {
    const nodes = workspace.collections.nodes;
    if (!nodes.has(space.id)) {
      return;
    }

    nodes.update(space.id, (draft) => {
      if (draft.type !== 'space') {
        return;
      }

      draft.name = values.name;
      draft.description = values.description;
      draft.avatar = values.avatar;
    });
  };

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
          onSubmit={handleSubmit}
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
