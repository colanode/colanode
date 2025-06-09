export type NodeCreatedEvent = {
  type: 'node.created';
  nodeId: string;
  rootId: string;
  workspaceId: string;
};

export type NodeUpdatedEvent = {
  type: 'node.updated';
  nodeId: string;
  rootId: string;
  workspaceId: string;
};

export type NodeDeletedEvent = {
  type: 'node.deleted';
  nodeId: string;
  rootId: string;
  workspaceId: string;
};

export type NodeInteractionUpdatedEvent = {
  type: 'node.interaction.updated';
  nodeId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
};

export type NodeReactionCreatedEvent = {
  type: 'node.reaction.created';
  nodeId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
};

export type NodeReactionDeletedEvent = {
  type: 'node.reaction.deleted';
  nodeId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
};

export type CollaborationCreatedEvent = {
  type: 'collaboration.created';
  collaboratorId: string;
  nodeId: string;
  workspaceId: string;
};

export type CollaborationUpdatedEvent = {
  type: 'collaboration.updated';
  collaboratorId: string;
  nodeId: string;
  workspaceId: string;
};

export type FileCreatedEvent = {
  type: 'file.created';
  fileId: string;
  rootId: string;
  workspaceId: string;
};

export type FileUpdatedEvent = {
  type: 'file.updated';
  fileId: string;
  rootId: string;
  workspaceId: string;
};

export type FileDeletedEvent = {
  type: 'file.deleted';
  fileId: string;
  rootId: string;
  workspaceId: string;
};

export type FileInteractionUpdatedEvent = {
  type: 'file.interaction.updated';
  fileId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
};

export type UserCreatedEvent = {
  type: 'user.created';
  userId: string;
  workspaceId: string;
  accountId: string;
};

export type UserUpdatedEvent = {
  type: 'user.updated';
  userId: string;
  workspaceId: string;
  accountId: string;
};

export type AccountUpdatedEvent = {
  type: 'account.updated';
  accountId: string;
};

export type WorkspaceCreatedEvent = {
  type: 'workspace.created';
  workspaceId: string;
};

export type WorkspaceUpdatedEvent = {
  type: 'workspace.updated';
  workspaceId: string;
};

export type WorkspaceDeletedEvent = {
  type: 'workspace.deleted';
  workspaceId: string;
};

export type DeviceDeletedEvent = {
  type: 'device.deleted';
  accountId: string;
  deviceId: string;
};

export type DocumentUpdatedEvent = {
  type: 'document.updated';
  documentId: string;
  workspaceId: string;
};

export type DocumentUpdateCreatedEvent = {
  type: 'document.update.created';
  documentId: string;
  rootId: string;
  workspaceId: string;
};

export type Event =
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
  | CollaborationCreatedEvent
  | CollaborationUpdatedEvent
  | NodeInteractionUpdatedEvent
  | NodeReactionCreatedEvent
  | NodeReactionDeletedEvent
  | UserCreatedEvent
  | UserUpdatedEvent
  | AccountUpdatedEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | DeviceDeletedEvent
  | FileCreatedEvent
  | FileUpdatedEvent
  | FileDeletedEvent
  | FileInteractionUpdatedEvent
  | DocumentUpdatedEvent
  | DocumentUpdateCreatedEvent;
