import { toast } from 'sonner';

import { LocalSpaceNode } from '@colanode/client/types';
import { SpaceAvatar } from '@colanode/ui/components/spaces/space-avatar';
import { SpaceDescription } from '@colanode/ui/components/spaces/space-description';
import { SpaceName } from '@colanode/ui/components/spaces/space-name';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface SpaceGeneralTabProps {
  space: LocalSpaceNode;
  readonly: boolean;
}

export const SpaceGeneralTab = ({ space, readonly }: SpaceGeneralTabProps) => {
  const workspace = useWorkspace();

  const { mutate, isPending } = useMutation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <SpaceAvatar
          space={space}
          readonly={readonly || isPending}
          onUpdate={(avatar) => {
            mutate({
              input: {
                type: 'space.avatar.update',
                spaceId: space.id,
                avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
        <SpaceName
          space={space}
          readonly={readonly || isPending}
          onUpdate={(name) => {
            mutate({
              input: {
                type: 'space.name.update',
                spaceId: space.id,
                name,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <p className="text-sm font-medium">Description</p>
        <SpaceDescription
          space={space}
          readonly={readonly || isPending}
          onUpdate={(description) => {
            mutate({
              input: {
                type: 'space.description.update',
                spaceId: space.id,
                description,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onError(error) {
                toast.error(error.message);
              },
            });
          }}
        />
      </div>
    </div>
  );
};
