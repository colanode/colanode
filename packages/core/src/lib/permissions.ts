import { NodeRole, WorkspaceRole } from '@colanode/core';

export type UserInput = {
  userId: string;
  role: WorkspaceRole;
};

export const hasWorkspaceRole = (
  currentRole: WorkspaceRole,
  targetRole: WorkspaceRole
) => {
  if (targetRole === 'owner') {
    return currentRole === 'owner';
  }

  if (targetRole === 'admin') {
    return currentRole === 'admin' || currentRole === 'owner';
  }

  if (targetRole === 'collaborator') {
    return (
      currentRole === 'admin' ||
      currentRole === 'collaborator' ||
      currentRole === 'owner'
    );
  }

  if (targetRole === 'guest') {
    return (
      currentRole === 'admin' ||
      currentRole === 'owner' ||
      currentRole === 'collaborator' ||
      currentRole === 'guest'
    );
  }

  return false;
};

export const hasNodeRole = (currentRole: NodeRole, targetRole: NodeRole) => {
  if (targetRole === 'admin') {
    return currentRole === 'admin';
  }

  if (targetRole === 'editor') {
    return currentRole === 'admin' || currentRole === 'editor';
  }

  if (targetRole === 'collaborator') {
    return (
      currentRole === 'admin' ||
      currentRole === 'editor' ||
      currentRole === 'collaborator'
    );
  }

  if (targetRole === 'viewer') {
    return (
      currentRole === 'admin' ||
      currentRole === 'editor' ||
      currentRole === 'collaborator' ||
      currentRole === 'viewer'
    );
  }

  return false;
};
