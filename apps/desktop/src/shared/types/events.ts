import { LocalNodeTransaction, Node } from '@colanode/core';
import { Account } from '@/shared/types/accounts';
import { Workspace } from '@/shared/types/workspaces';
import { Server } from '@/shared/types/servers';
import { Download, Upload, UserNode } from '@/shared/types/nodes';

export type NodeCreatedEvent = {
  type: 'node_created';
  userId: string;
  node: Node;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  userId: string;
  node: Node;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  userId: string;
  node: Node;
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

export type UserNodeCreatedEvent = {
  type: 'user_node_created';
  userId: string;
  userNode: UserNode;
};

export type UserNodeUpdatedEvent = {
  type: 'user_node_updated';
  userId: string;
  userNode: UserNode;
};

export type DownloadCreatedEvent = {
  type: 'download_created';
  userId: string;
  download: Download;
};

export type DownloadUpdatedEvent = {
  type: 'download_updated';
  userId: string;
  download: Download;
};

export type DownloadDeletedEvent = {
  type: 'download_deleted';
  userId: string;
  download: Download;
};

export type UploadCreatedEvent = {
  type: 'upload_created';
  userId: string;
  upload: Upload;
};

export type UploadUpdatedEvent = {
  type: 'upload_updated';
  userId: string;
  upload: Upload;
};

export type UploadDeletedEvent = {
  type: 'upload_deleted';
  userId: string;
  upload: Upload;
};

export type QueryResultUpdatedEvent = {
  type: 'query_result_updated';
  id: string;
  result: any;
};

export type RadarDataUpdatedEvent = {
  type: 'radar_data_updated';
};

export type NodeTransactionCreatedEvent = {
  type: 'node_transaction_created';
  userId: string;
  transaction: LocalNodeTransaction;
};

export type ServerAvailabilityChangedEvent = {
  type: 'server_availability_changed';
  server: Server;
  isAvailable: boolean;
};

export type Event =
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
  | AccountCreatedEvent
  | AccountUpdatedEvent
  | AccountDeletedEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | ServerCreatedEvent
  | ServerUpdatedEvent
  | UserNodeCreatedEvent
  | UserNodeUpdatedEvent
  | DownloadCreatedEvent
  | DownloadUpdatedEvent
  | DownloadDeletedEvent
  | UploadCreatedEvent
  | UploadUpdatedEvent
  | UploadDeletedEvent
  | QueryResultUpdatedEvent
  | RadarDataUpdatedEvent
  | NodeTransactionCreatedEvent
  | ServerAvailabilityChangedEvent;
