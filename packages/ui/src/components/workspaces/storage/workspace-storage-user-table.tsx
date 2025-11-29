import { WorkspaceStorageUser } from '@colanode/core';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@colanode/ui/components/ui/table';
import { WorkspaceStorageUserRow } from '@colanode/ui/components/workspaces/storage/workspace-storage-user-row';

interface WorkspaceStorageUserTableProps {
  users: WorkspaceStorageUser[];
  onUsersUpdated: () => void;
}

export const WorkspaceStorageUserTable = ({
  users,
  onUsersUpdated,
}: WorkspaceStorageUserTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead className="text-center">File Size Limit</TableHead>
          <TableHead className="text-center">Total Storage</TableHead>
          <TableHead className="text-center">Used Storage</TableHead>
          <TableHead className="w-10 text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <WorkspaceStorageUserRow
            key={user.id}
            user={user}
            onUpdate={onUsersUpdated}
          />
        ))}
      </TableBody>
    </Table>
  );
};
