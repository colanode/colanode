import { Account, AccountMetadata } from '@colanode/client/types/accounts';
import { AppMetadata } from '@colanode/client/types/apps';
import { Avatar } from '@colanode/client/types/avatars';
import {
  Document,
  DocumentState,
  DocumentUpdate,
} from '@colanode/client/types/documents';
import {
  LocalFile,
  Upload,
  Download,
  TempFile,
} from '@colanode/client/types/files';
import {
  LocalNode,
  NodeCounter,
  NodeInteraction,
  NodeReaction,
  NodeReference,
} from '@colanode/client/types/nodes';
import { Server } from '@colanode/client/types/servers';
import { User } from '@colanode/client/types/users';
import {
  Workspace,
  WorkspaceMetadata,
} from '@colanode/client/types/workspaces';
import { Message } from '@colanode/core';

export type UserCreatedEvent = {
  type: 'user.created';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type UserUpdatedEvent = {
  type: 'user.updated';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type UserDeletedEvent = {
  type: 'user.deleted';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type NodeCreatedEvent = {
  type: 'node.created';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeUpdatedEvent = {
  type: 'node.updated';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeDeletedEvent = {
  type: 'node.deleted';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeInteractionUpdatedEvent = {
  type: 'node.interaction.updated';
  accountId: string;
  workspaceId: string;
  nodeInteraction: NodeInteraction;
};

export type NodeReactionCreatedEvent = {
  type: 'node.reaction.created';
  accountId: string;
  workspaceId: string;
  nodeReaction: NodeReaction;
};

export type NodeReactionDeletedEvent = {
  type: 'node.reaction.deleted';
  accountId: string;
  workspaceId: string;
  nodeReaction: NodeReaction;
};

export type LocalFileCreatedEvent = {
  type: 'local.file.created';
  accountId: string;
  workspaceId: string;
  localFile: LocalFile;
};

export type LocalFileDeletedEvent = {
  type: 'local.file.deleted';
  accountId: string;
  workspaceId: string;
  localFile: LocalFile;
};

export type UploadCreatedEvent = {
  type: 'upload.created';
  accountId: string;
  workspaceId: string;
  upload: Upload;
};

export type UploadUpdatedEvent = {
  type: 'upload.updated';
  accountId: string;
  workspaceId: string;
  upload: Upload;
};

export type UploadDeletedEvent = {
  type: 'upload.deleted';
  accountId: string;
  workspaceId: string;
  upload: Upload;
};

export type DownloadCreatedEvent = {
  type: 'download.created';
  accountId: string;
  workspaceId: string;
  download: Download;
};

export type DownloadUpdatedEvent = {
  type: 'download.updated';
  accountId: string;
  workspaceId: string;
  download: Download;
};

export type DownloadDeletedEvent = {
  type: 'download.deleted';
  accountId: string;
  workspaceId: string;
  download: Download;
};

export type AccountCreatedEvent = {
  type: 'account.created';
  account: Account;
};

export type AccountUpdatedEvent = {
  type: 'account.updated';
  account: Account;
};

export type AccountDeletedEvent = {
  type: 'account.deleted';
  account: Account;
};

export type WorkspaceCreatedEvent = {
  type: 'workspace.created';
  workspace: Workspace;
};

export type WorkspaceUpdatedEvent = {
  type: 'workspace.updated';
  workspace: Workspace;
};

export type WorkspaceDeletedEvent = {
  type: 'workspace.deleted';
  workspace: Workspace;
};

export type ServerCreatedEvent = {
  type: 'server.created';
  server: Server;
};

export type ServerUpdatedEvent = {
  type: 'server.updated';
  server: Server;
};

export type ServerDeletedEvent = {
  type: 'server.deleted';
  server: Server;
};

export type QueryResultUpdatedEvent = {
  type: 'query.result.updated';
  id: string;
  result: unknown;
};

export type RadarDataUpdatedEvent = {
  type: 'radar.data.updated';
};

export type CollaborationCreatedEvent = {
  type: 'collaboration.created';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration.deleted';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type ServerAvailabilityChangedEvent = {
  type: 'server.availability.changed';
  server: Server;
  isAvailable: boolean;
};

export type AccountConnectionOpenedEvent = {
  type: 'account.connection.opened';
  accountId: string;
};

export type AccountConnectionClosedEvent = {
  type: 'account.connection.closed';
  accountId: string;
};

export type AccountConnectionMessageReceivedEvent = {
  type: 'account.connection.message.received';
  accountId: string;
  message: Message;
};

export type AppMetadataUpdatedEvent = {
  type: 'app.metadata.updated';
  metadata: AppMetadata;
};

export type AppMetadataDeletedEvent = {
  type: 'app.metadata.deleted';
  metadata: AppMetadata;
};

export type AccountMetadataUpdatedEvent = {
  type: 'account.metadata.updated';
  accountId: string;
  metadata: AccountMetadata;
};

export type AccountMetadataDeletedEvent = {
  type: 'account.metadata.deleted';
  accountId: string;
  metadata: AccountMetadata;
};

export type WorkspaceMetadataUpdatedEvent = {
  type: 'workspace.metadata.updated';
  accountId: string;
  workspaceId: string;
  metadata: WorkspaceMetadata;
};

export type WorkspaceMetadataDeletedEvent = {
  type: 'workspace.metadata.deleted';
  accountId: string;
  workspaceId: string;
  metadata: WorkspaceMetadata;
};

export type DocumentUpdatedEvent = {
  type: 'document.updated';
  accountId: string;
  workspaceId: string;
  document: Document;
};

export type DocumentDeletedEvent = {
  type: 'document.deleted';
  accountId: string;
  workspaceId: string;
  documentId: string;
};

export type DocumentStateUpdatedEvent = {
  type: 'document.state.updated';
  accountId: string;
  workspaceId: string;
  documentState: DocumentState;
};

export type DocumentUpdateCreatedEvent = {
  type: 'document.update.created';
  accountId: string;
  workspaceId: string;
  documentUpdate: DocumentUpdate;
};

export type DocumentUpdateDeletedEvent = {
  type: 'document.update.deleted';
  accountId: string;
  workspaceId: string;
  documentId: string;
  updateId: string;
};

export type NodeReferenceCreatedEvent = {
  type: 'node.reference.created';
  accountId: string;
  workspaceId: string;
  nodeReference: NodeReference;
};

export type NodeReferenceDeletedEvent = {
  type: 'node.reference.deleted';
  accountId: string;
  workspaceId: string;
  nodeReference: NodeReference;
};

export type NodeCounterUpdatedEvent = {
  type: 'node.counter.updated';
  accountId: string;
  workspaceId: string;
  counter: NodeCounter;
};

export type NodeCounterDeletedEvent = {
  type: 'node.counter.deleted';
  accountId: string;
  workspaceId: string;
  counter: NodeCounter;
};

export type AvatarCreatedEvent = {
  type: 'avatar.created';
  accountId: string;
  avatar: Avatar;
};

export type AvatarDeletedEvent = {
  type: 'avatar.deleted';
  accountId: string;
  avatar: Avatar;
};

export type TempFileCreatedEvent = {
  type: 'temp.file.created';
  tempFile: TempFile;
};

export type TempFileDeletedEvent = {
  type: 'temp.file.deleted';
  tempFile: TempFile;
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
  | ServerDeletedEvent
  | ServerAvailabilityChangedEvent
  | LocalFileCreatedEvent
  | LocalFileDeletedEvent
  | UploadCreatedEvent
  | UploadUpdatedEvent
  | UploadDeletedEvent
  | DownloadCreatedEvent
  | DownloadUpdatedEvent
  | DownloadDeletedEvent
  | QueryResultUpdatedEvent
  | RadarDataUpdatedEvent
  | CollaborationCreatedEvent
  | CollaborationDeletedEvent
  | AccountConnectionOpenedEvent
  | AccountConnectionClosedEvent
  | AccountConnectionMessageReceivedEvent
  | AppMetadataUpdatedEvent
  | AppMetadataDeletedEvent
  | AccountMetadataUpdatedEvent
  | AccountMetadataDeletedEvent
  | WorkspaceMetadataUpdatedEvent
  | WorkspaceMetadataDeletedEvent
  | DocumentUpdatedEvent
  | DocumentDeletedEvent
  | DocumentStateUpdatedEvent
  | DocumentUpdateCreatedEvent
  | DocumentUpdateDeletedEvent
  | NodeReferenceCreatedEvent
  | NodeReferenceDeletedEvent
  | NodeCounterUpdatedEvent
  | NodeCounterDeletedEvent
  | AvatarCreatedEvent
  | AvatarDeletedEvent
  | TempFileCreatedEvent
  | TempFileDeletedEvent;
