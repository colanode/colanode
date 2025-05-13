import { Message } from '@colanode/core';

import { AppMetadata } from '../types/apps';
import { Account, AccountMetadata } from '../types/accounts';
import { Server } from '../types/servers';
import { Workspace, WorkspaceMetadata } from '../types/workspaces';
import { User } from '../types/users';
import { FileState } from '../types/files';
import {
  LocalNode,
  NodeCounter,
  NodeInteraction,
  NodeReaction,
  NodeReference,
} from '../types/nodes';
import { Document, DocumentState, DocumentUpdate } from '../types/documents';

export type UserCreatedEvent = {
  type: 'user_created';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type UserUpdatedEvent = {
  type: 'user_updated';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type UserDeletedEvent = {
  type: 'user_deleted';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type NodeCreatedEvent = {
  type: 'node_created';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeInteractionUpdatedEvent = {
  type: 'node_interaction_updated';
  accountId: string;
  workspaceId: string;
  nodeInteraction: NodeInteraction;
};

export type NodeReactionCreatedEvent = {
  type: 'node_reaction_created';
  accountId: string;
  workspaceId: string;
  nodeReaction: NodeReaction;
};

export type NodeReactionDeletedEvent = {
  type: 'node_reaction_deleted';
  accountId: string;
  workspaceId: string;
  nodeReaction: NodeReaction;
};

export type FileStateUpdatedEvent = {
  type: 'file_state_updated';
  accountId: string;
  workspaceId: string;
  fileState: FileState;
};

export type AccountCreatedEvent = {
  type: 'account_created';
  account: Account;
};

export type AccountUpdatedEvent = {
  type: 'account_updated';
  account: Account;
};

export type AccountDeletedEvent = {
  type: 'account_deleted';
  account: Account;
};

export type WorkspaceCreatedEvent = {
  type: 'workspace_created';
  workspace: Workspace;
};

export type WorkspaceUpdatedEvent = {
  type: 'workspace_updated';
  workspace: Workspace;
};

export type WorkspaceDeletedEvent = {
  type: 'workspace_deleted';
  workspace: Workspace;
};

export type ServerCreatedEvent = {
  type: 'server_created';
  server: Server;
};

export type ServerUpdatedEvent = {
  type: 'server_updated';
  server: Server;
};

export type QueryResultUpdatedEvent = {
  type: 'query_result_updated';
  id: string;
  result: unknown;
};

export type RadarDataUpdatedEvent = {
  type: 'radar_data_updated';
};

export type CollaborationCreatedEvent = {
  type: 'collaboration_created';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration_deleted';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type ServerAvailabilityChangedEvent = {
  type: 'server_availability_changed';
  server: Server;
  isAvailable: boolean;
};

export type AccountConnectionOpenedEvent = {
  type: 'account_connection_opened';
  accountId: string;
};

export type AccountConnectionClosedEvent = {
  type: 'account_connection_closed';
  accountId: string;
};

export type AccountConnectionMessageEvent = {
  type: 'account_connection_message';
  accountId: string;
  message: Message;
};

export type AppMetadataSavedEvent = {
  type: 'app_metadata_saved';
  metadata: AppMetadata;
};

export type AppMetadataDeletedEvent = {
  type: 'app_metadata_deleted';
  metadata: AppMetadata;
};

export type AccountMetadataSavedEvent = {
  type: 'account_metadata_saved';
  accountId: string;
  metadata: AccountMetadata;
};

export type AccountMetadataDeletedEvent = {
  type: 'account_metadata_deleted';
  accountId: string;
  metadata: AccountMetadata;
};

export type WorkspaceMetadataSavedEvent = {
  type: 'workspace_metadata_saved';
  accountId: string;
  workspaceId: string;
  metadata: WorkspaceMetadata;
};

export type WorkspaceMetadataDeletedEvent = {
  type: 'workspace_metadata_deleted';
  accountId: string;
  workspaceId: string;
  metadata: WorkspaceMetadata;
};

export type DocumentUpdatedEvent = {
  type: 'document_updated';
  accountId: string;
  workspaceId: string;
  document: Document;
};

export type DocumentDeletedEvent = {
  type: 'document_deleted';
  accountId: string;
  workspaceId: string;
  documentId: string;
};

export type DocumentStateUpdatedEvent = {
  type: 'document_state_updated';
  accountId: string;
  workspaceId: string;
  documentState: DocumentState;
};

export type DocumentUpdateCreatedEvent = {
  type: 'document_update_created';
  accountId: string;
  workspaceId: string;
  documentUpdate: DocumentUpdate;
};

export type DocumentUpdateDeletedEvent = {
  type: 'document_update_deleted';
  accountId: string;
  workspaceId: string;
  documentId: string;
  updateId: string;
};

export type NodeReferenceCreatedEvent = {
  type: 'node_reference_created';
  accountId: string;
  workspaceId: string;
  nodeReference: NodeReference;
};

export type NodeReferenceDeletedEvent = {
  type: 'node_reference_deleted';
  accountId: string;
  workspaceId: string;
  nodeReference: NodeReference;
};

export type NodeCounterUpdatedEvent = {
  type: 'node_counter_updated';
  accountId: string;
  workspaceId: string;
  counter: NodeCounter;
};

export type NodeCounterDeletedEvent = {
  type: 'node_counter_deleted';
  accountId: string;
  workspaceId: string;
  counter: NodeCounter;
};

export type Event =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
  | NodeInteractionUpdatedEvent
  | NodeReactionCreatedEvent
  | NodeReactionDeletedEvent
  | AccountCreatedEvent
  | AccountUpdatedEvent
  | AccountDeletedEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | ServerCreatedEvent
  | ServerUpdatedEvent
  | FileStateUpdatedEvent
  | QueryResultUpdatedEvent
  | RadarDataUpdatedEvent
  | ServerAvailabilityChangedEvent
  | CollaborationCreatedEvent
  | CollaborationDeletedEvent
  | AccountConnectionOpenedEvent
  | AccountConnectionClosedEvent
  | AccountConnectionMessageEvent
  | AppMetadataSavedEvent
  | AppMetadataDeletedEvent
  | AccountMetadataSavedEvent
  | AccountMetadataDeletedEvent
  | WorkspaceMetadataSavedEvent
  | WorkspaceMetadataDeletedEvent
  | DocumentUpdatedEvent
  | DocumentDeletedEvent
  | DocumentStateUpdatedEvent
  | DocumentUpdateCreatedEvent
  | DocumentUpdateDeletedEvent
  | NodeReferenceCreatedEvent
  | NodeReferenceDeletedEvent
  | NodeCounterUpdatedEvent
  | NodeCounterDeletedEvent;
