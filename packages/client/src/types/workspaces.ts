import { WorkspaceRole, WorkspaceStatus } from '@colanode/core';

export type Workspace = {
  userId: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  accountId: string;
  role: WorkspaceRole;
  maxFileSize?: string | null;
  status: WorkspaceStatus;
};

export type SidebarMenuType = 'chats' | 'spaces' | 'settings';
