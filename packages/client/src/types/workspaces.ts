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

export type ContainerTab = {
  path: string;
  preview?: boolean;
  active?: boolean;
};

export type ContainerMetadata = {
  tabs: ContainerTab[];
  width?: number;
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

export type WorkspaceLeftContainerMetadata = {
  key: 'container.left';
  value: ContainerMetadata;
  createdAt: string;
  updatedAt: string | null;
};

export type WorkspaceRightContainerMetadata = {
  key: 'container.right';
  value: ContainerMetadata;
  createdAt: string;
  updatedAt: string | null;
};

export type WorkspaceMetadata =
  | WorkspaceSidebarMetadata
  | WorkspaceRightContainerMetadata
  | WorkspaceLeftContainerMetadata;

export type WorkspaceMetadataKey = WorkspaceMetadata['key'];

export type WorkspaceMetadataMap = {
  sidebar: WorkspaceSidebarMetadata;
  'container.right': WorkspaceRightContainerMetadata;
  'container.left': WorkspaceLeftContainerMetadata;
};

export enum SpecialContainerTabPath {
  WorkspaceSettings = 'workspace/settings',
  WorkspaceStorage = 'workspace/storage',
  WorkspaceUsers = 'workspace/users',
  WorkspaceUploads = 'workspace/uploads',
  WorkspaceDownloads = 'workspace/downloads',
  WorkspaceDelete = 'workspace/delete',
  AccountSettings = 'account/settings',
  AccountLogout = 'account/logout',
  AppAppearance = 'app/appearance',
}
