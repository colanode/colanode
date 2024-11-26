import { NodeOutput } from './nodes';

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'collaborator'
  | 'guest'
  | 'none';

export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2,
}

export enum WorkspaceUserStatus {
  Active = 1,
  Inactive = 2,
}

export type WorkspaceCreateInput = {
  name: string;
  description?: string | null;
  avatar?: string | null;
};

export type WorkspaceOutput = {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  versionId: string;
  user: WorkspaceUserOutput;
};

export type WorkspaceUserOutput = {
  id: string;
  accountId: string;
  role: WorkspaceRole;
};

export type WorkspaceUpdateInput = {
  name: string;
  description?: string | null;
  avatar?: string | null;
};

export type WorkspaceUsersInviteInput = {
  emails: string[];
  role: WorkspaceRole;
};

export type WorkspaceUserInviteResult = {
  email: string;
  result: 'success' | 'error' | 'exists';
};

export type WorkspaceUsersInviteOutput = {
  results: WorkspaceUserInviteResult[];
};

export type WorkspaceUserRoleUpdateInput = {
  role: WorkspaceRole;
};

export type WorkspaceUserRoleUpdateOutput = {
  user: NodeOutput;
};
