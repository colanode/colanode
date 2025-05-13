import { LocalSpaceNode } from '@colanode/client/types';

import { SpaceAvatar } from '@/renderer/components/spaces/space-avatar';
import { SpaceDescription } from '@/renderer/components/spaces/space-description';
import { SpaceName } from '@/renderer/components/spaces/space-name';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

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
                type: 'space_avatar_update',
                spaceId: space.id,
                avatar,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onError(error) {
                toast({
                  title: 'Failed to update space avatar',
                  description: error.message,
                  variant: 'destructive',
                });
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
                type: 'space_name_update',
                spaceId: space.id,
                name,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onError(error) {
                toast({
                  title: 'Failed to update space name',
                  description: error.message,
                  variant: 'destructive',
                });
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
                type: 'space_description_update',
                spaceId: space.id,
                description,
                accountId: workspace.accountId,
                workspaceId: workspace.id,
              },
              onError(error) {
                toast({
                  title: 'Failed to update space description',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        />
      </div>
    </div>
  );
};
