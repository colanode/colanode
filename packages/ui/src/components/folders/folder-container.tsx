import { LocalFolderNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { FolderBody } from '@colanode/ui/components/folders/folder-body';

interface FolderContainerProps {
  folder: LocalFolderNode;
  role: NodeRole;
}

export const FolderContainer = ({ folder, role }: FolderContainerProps) => {
  return <FolderBody folder={folder} role={role} />;
};
