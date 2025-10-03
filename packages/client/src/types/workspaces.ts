import { WorkspaceRole } from '@colanode/core';

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  accountId: string;
  role: WorkspaceRole;
  userId: string;
  maxFileSize: string;
  storageLimit: string;
};

export type WorkspaceSidebarWidthMetadata = {
  key: 'sidebar.width';
  value: number;
  createdAt: string;
  updatedAt: string | null;
};

export type WorkspaceLocationMetadata = {
  key: 'location';
  value: string;
  createdAt: string;
  updatedAt: string | null;
};

export type WorkspaceMetadata =
  | WorkspaceSidebarWidthMetadata
  | WorkspaceLocationMetadata;

export type WorkspaceMetadataKey = WorkspaceMetadata['key'];

export type WorkspaceMetadataMap = {
  'sidebar.width': WorkspaceSidebarWidthMetadata;
  location: WorkspaceLocationMetadata;
};

export type SidebarMenuType = 'chats' | 'spaces' | 'settings';
