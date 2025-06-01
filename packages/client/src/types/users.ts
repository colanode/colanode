import { WorkspaceRole } from '@colanode/core';

export type User = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  customName: string | null;
  customAvatar: string | null;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string | null;
};
