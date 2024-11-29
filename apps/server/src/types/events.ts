import { NodeType } from '@colanode/core';

export type NodeCreatedEvent = {
  type: 'node_created';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type CollaboratorAddedEvent = {
  type: 'collaborator_added';
  userId: string;
  nodeId: string;
};

export type CollaboratorRemovedEvent = {
  type: 'collaborator_removed';
  userId: string;
  nodeId: string;
};

export type InteractionUpdatedEvent = {
  type: 'interaction_updated';
  userId: string;
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type Event =
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
  | CollaboratorAddedEvent
  | CollaboratorRemovedEvent
  | InteractionUpdatedEvent;
