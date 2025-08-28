import { toast } from 'sonner';

import { LocalSpaceNode } from '@colanode/client/types';
import { NodeRole, hasNodeRole } from '@colanode/core';
import { NodeCollaborators } from '@colanode/ui/components/collaborators/node-collaborators';
import { SpaceDelete } from '@colanode/ui/components/spaces/space-delete';
import { SpaceForm } from '@colanode/ui/components/spaces/space-form';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import {
  ScrollArea,
  ScrollBar,
  ScrollViewport,
} from '@colanode/ui/components/ui/scroll-area';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useLayout } from '@colanode/ui/contexts/layout';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface SpaceBodyProps {
  space: LocalSpaceNode;
  role: NodeRole;
}

export const SpaceBody = ({ space, role }: SpaceBodyProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const layout = useLayout();
  const canEdit = hasNodeRole(role, 'admin');
  const canDelete = hasNodeRole(role, 'admin');

  return (
    <Container>
      <ContainerBody>
        <ScrollArea className="relative overflow-hidden">
          <ScrollViewport className="h-full max-h-[calc(100vh-100px)] w-full overflow-y-auto rounded-[inherit]">
            <div className="max-w-4xl space-y-8 w-full pb-10">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    General
                  </h2>
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
                    mutate({
                      input: {
                        type: 'space.update',
                        accountId: workspace.accountId,
                        workspaceId: workspace.id,
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
                  isSaving={isPending}
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
                  <SpaceDelete
                    id={space.id}
                    onDeleted={() => {
                      layout.close(space.id);
                    }}
                  />
                </div>
              )}
            </div>
          </ScrollViewport>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </ContainerBody>
    </Container>
  );
};
