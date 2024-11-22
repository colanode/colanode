import { Node, NodeAttributes, NodeRole } from '../index';
import { generateKeyBetween } from 'fractional-indexing-jittered';

export const extractNodeCollaborators = (
  attributes: NodeAttributes
): Record<string, NodeRole> => {
  if ('collaborators' in attributes && attributes.collaborators) {
    return attributes.collaborators as Record<string, NodeRole>;
  }

  return {};
};

export const extractNodeName = (attributes: NodeAttributes): string | null => {
  if ('name' in attributes && attributes.name) {
    return attributes.name as string;
  }

  return null;
};

export const extractNodeRole = (
  nodeTree: Node | Node[],
  collaboratorId: string
): NodeRole | null => {
  const nodes = Array.isArray(nodeTree) ? nodeTree : [nodeTree];
  let role: NodeRole | null = null;
  for (const node of nodes) {
    const collaborators = extractNodeCollaborators(node.attributes);
    const collaboratorRole = collaborators[collaboratorId];
    if (collaboratorRole) {
      role = collaboratorRole;
    }
  }

  return role;
};

export const hasAdminAccess = (role: NodeRole | null): boolean => {
  return role === 'admin';
};

export const hasEditorAccess = (role: NodeRole | null): boolean => {
  return role === 'admin' || role === 'editor';
};

export const hasCollaboratorAccess = (role: NodeRole | null): boolean => {
  return role === 'admin' || role === 'editor' || role === 'collaborator';
};

export const hasViewerAccess = (role: NodeRole | null): boolean => {
  return (
    role === 'admin' ||
    role === 'editor' ||
    role === 'collaborator' ||
    role === 'viewer'
  );
};

export const generateNodeIndex = (
  previous?: string | null,
  next?: string | null
) => {
  const lower = previous === undefined ? null : previous;
  const upper = next === undefined ? null : next;

  return generateKeyBetween(lower, upper);
};
