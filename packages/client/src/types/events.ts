import { Account } from '@colanode/client/types/accounts';
import { Metadata, Tab } from '@colanode/client/types/apps';
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
import { Workspace } from '@colanode/client/types/workspaces';
import { Message } from '@colanode/core';

export type WorkspaceEventData = {
  workspaceId: string;
  userId: string;
  accountId: string;
};

export type UserCreatedEvent = {
  type: 'user.created';
  workspace: WorkspaceEventData;
  user: User;
};

export type UserUpdatedEvent = {
  type: 'user.updated';
  workspace: WorkspaceEventData;
  user: User;
};

export type UserDeletedEvent = {
  type: 'user.deleted';
  workspace: WorkspaceEventData;
  user: User;
};

export type NodeCreatedEvent = {
  type: 'node.created';
  workspace: WorkspaceEventData;
  node: LocalNode;
};

export type NodeUpdatedEvent = {
  type: 'node.updated';
  workspace: WorkspaceEventData;
  node: LocalNode;
};

export type NodeDeletedEvent = {
  type: 'node.deleted';
  workspace: WorkspaceEventData;
  node: LocalNode;
};

export type NodeInteractionUpdatedEvent = {
  type: 'node.interaction.updated';
  workspace: WorkspaceEventData;
  nodeInteraction: NodeInteraction;
};

export type NodeReactionCreatedEvent = {
  type: 'node.reaction.created';
  workspace: WorkspaceEventData;
  nodeReaction: NodeReaction;
};

export type NodeReactionDeletedEvent = {
  type: 'node.reaction.deleted';
  workspace: WorkspaceEventData;
  nodeReaction: NodeReaction;
};

export type LocalFileCreatedEvent = {
  type: 'local.file.created';
  workspace: WorkspaceEventData;
  localFile: LocalFile;
};

export type LocalFileUpdatedEvent = {
  type: 'local.file.updated';
  workspace: WorkspaceEventData;
  localFile: LocalFile;
};

export type LocalFileDeletedEvent = {
  type: 'local.file.deleted';
  workspace: WorkspaceEventData;
  localFile: LocalFile;
};

export type UploadCreatedEvent = {
  type: 'upload.created';
  workspace: WorkspaceEventData;
  upload: Upload;
};

export type UploadUpdatedEvent = {
  type: 'upload.updated';
  workspace: WorkspaceEventData;
  upload: Upload;
};

export type UploadDeletedEvent = {
  type: 'upload.deleted';
  workspace: WorkspaceEventData;
  upload: Upload;
};

export type DownloadCreatedEvent = {
  type: 'download.created';
  workspace: WorkspaceEventData;
  download: Download;
};

export type DownloadUpdatedEvent = {
  type: 'download.updated';
  workspace: WorkspaceEventData;
  download: Download;
};

export type DownloadDeletedEvent = {
  type: 'download.deleted';
  workspace: WorkspaceEventData;
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

export type ServerAvailabilityChangedEvent = {
  type: 'server.availability.changed';
  domain: string;
  isAvailable: boolean;
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
  workspace: WorkspaceEventData;
  nodeId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration.deleted';
  workspace: WorkspaceEventData;
  nodeId: string;
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

export type MetadataUpdatedEvent = {
  type: 'metadata.updated';
  metadata: Metadata;
};

export type MetadataDeletedEvent = {
  type: 'metadata.deleted';
  metadata: Metadata;
};

export type DocumentUpdatedEvent = {
  type: 'document.updated';
  workspace: WorkspaceEventData;
  document: Document;
};

export type DocumentDeletedEvent = {
  type: 'document.deleted';
  workspace: WorkspaceEventData;
  documentId: string;
};

export type DocumentStateUpdatedEvent = {
  type: 'document.state.updated';
  workspace: WorkspaceEventData;
  documentState: DocumentState;
};

export type DocumentUpdateCreatedEvent = {
  type: 'document.update.created';
  workspace: WorkspaceEventData;
  documentUpdate: DocumentUpdate;
};

export type DocumentUpdateDeletedEvent = {
  type: 'document.update.deleted';
  workspace: WorkspaceEventData;
  documentId: string;
  updateId: string;
};

export type NodeReferenceCreatedEvent = {
  type: 'node.reference.created';
  workspace: WorkspaceEventData;
  nodeReference: NodeReference;
};

export type NodeReferenceDeletedEvent = {
  type: 'node.reference.deleted';
  workspace: WorkspaceEventData;
  nodeReference: NodeReference;
};

export type NodeCounterUpdatedEvent = {
  type: 'node.counter.updated';
  workspace: WorkspaceEventData;
  counter: NodeCounter;
};

export type NodeCounterDeletedEvent = {
  type: 'node.counter.deleted';
  workspace: WorkspaceEventData;
  counter: NodeCounter;
};

export type AvatarCreatedEvent = {
  type: 'avatar.created';
  avatar: Avatar;
};

export type AvatarDeletedEvent = {
  type: 'avatar.deleted';
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

export type TabCreatedEvent = {
  type: 'tab.created';
  tab: Tab;
};

export type TabUpdatedEvent = {
  type: 'tab.updated';
  tab: Tab;
};

export type TabDeletedEvent = {
  type: 'tab.deleted';
  tab: Tab;
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
  | LocalFileUpdatedEvent
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
  | MetadataUpdatedEvent
  | MetadataDeletedEvent
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
  | TempFileDeletedEvent
  | TabCreatedEvent
  | TabUpdatedEvent
  | TabDeletedEvent;
