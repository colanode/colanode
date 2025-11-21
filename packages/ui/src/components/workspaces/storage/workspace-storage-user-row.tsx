import { eq, useLiveQuery } from '@tanstack/react-db';
import { Settings } from 'lucide-react';
import { useState } from 'react';

import { formatBytes, WorkspaceStorageUser } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { Button } from '@colanode/ui/components/ui/button';
import { TableCell, TableRow } from '@colanode/ui/components/ui/table';
import { WorkspaceStorageUserUpdateDialog } from '@colanode/ui/components/workspaces/storage/workspace-storage-user-update-dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { bigintToPercent, cn } from '@colanode/ui/lib/utils';

interface UserStorageProgressBarProps {
  storageUsed: string;
  storageLimit: string;
}

const UserStorageProgressBar = ({
  storageUsed,
  storageLimit,
}: UserStorageProgressBarProps) => {
  const percentage = bigintToPercent(BigInt(storageLimit), BigInt(storageUsed));

  const getBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{formatBytes(BigInt(storageUsed))}</span>
        <span className="text-muted-foreground">
          ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', getBarColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

interface WorkspaceStorageUserRowProps {
  user: WorkspaceStorageUser;
  onUpdate: () => void;
}

export const WorkspaceStorageUserRow = ({
  user,
  onUpdate,
}: WorkspaceStorageUserRowProps) => {
  const workspace = useWorkspace();
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  const userQuery = useLiveQuery(
    (q) =>
      q
        .from({ users: workspace.collections.users })
        .where(({ users }) => eq(users.id, user.id))
        .select(({ users }) => ({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          email: users.email,
        }))
        .findOne(),
    [workspace.userId, user.id]
  );

  const name = userQuery.data?.name ?? 'Unknown';
  const email = userQuery.data?.email ?? '';
  const avatar = userQuery.data?.avatar ?? null;

  const storageLimitBytes = BigInt(user.storageLimit);
  const maxFileSizeBytes = user.maxFileSize ? BigInt(user.maxFileSize) : null;
  const storageUsed = user.usage.uploads.size ?? '0';

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center space-x-3">
            <Avatar id={user.id} name={name} avatar={avatar} />
            <div className="grow min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {name}
              </p>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <span className="text-sm font-medium">
            {maxFileSizeBytes ? formatBytes(maxFileSizeBytes) : '#'}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <span className="text-sm font-medium">
            {formatBytes(storageLimitBytes)}
          </span>
        </TableCell>
        <TableCell className="min-w-[200px] text-center">
          <UserStorageProgressBar
            storageLimit={user.storageLimit}
            storageUsed={storageUsed}
          />
        </TableCell>
        <TableCell className="w-10 text-right">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpenUpdateDialog(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      {openUpdateDialog && (
        <WorkspaceStorageUserUpdateDialog
          user={user}
          open={openUpdateDialog}
          onOpenChange={setOpenUpdateDialog}
          onUpdate={() => {
            onUpdate();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};
