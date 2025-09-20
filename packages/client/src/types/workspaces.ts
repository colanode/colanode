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

export type SidebarMenuType = 'chats' | 'spaces' | 'settings';

export type SidebarMetadata = {
  menu: SidebarMenuType;
  width: number;
};

export type WorkspaceSidebarMetadata = {
  key: 'sidebar';
  value: SidebarMetadata;
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
  | WorkspaceSidebarMetadata
  | WorkspaceLocationMetadata;

export type WorkspaceMetadataKey = WorkspaceMetadata['key'];

export type WorkspaceMetadataMap = {
  sidebar: WorkspaceSidebarMetadata;
  location: WorkspaceLocationMetadata;
};
