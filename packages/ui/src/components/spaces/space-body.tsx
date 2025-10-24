import { LocalSpaceNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { NodeCollaborators } from '@colanode/ui/components/collaborators/node-collaborators';
import { SpaceDelete } from '@colanode/ui/components/spaces/space-delete';
import { SpaceForm } from '@colanode/ui/components/spaces/space-form';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

interface SpaceBodyProps {
  space: LocalSpaceNode;
  role: NodeRole;
}

export const SpaceBody = ({ space, role }: SpaceBodyProps) => {
  const workspace = useWorkspace();

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
            name: space.attributes.name,
            description: space.attributes.description ?? '',
            avatar: space.attributes.avatar ?? null,
          }}
          readOnly={!canEdit}
          onSubmit={(values) => {
            const nodes = database.workspace(workspace.userId).nodes;
            if (!nodes.has(space.id)) {
              return;
            }

            nodes.update(space.id, (draft) => {
              if (draft.attributes.type !== 'space') {
                return;
              }

              draft.attributes.name = values.name;
              draft.attributes.description = values.description;
              draft.attributes.avatar = values.avatar;
            });
          }}
          isPending={false}
          saveText="Update"
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
          <SpaceDelete id={space.id} />
        </div>
      )}
    </div>
  );
};
