import {
  ChannelAttributes,
  ChannelCollaborationAttributes,
  channelCollaborationModel,
  channelModel,
} from './channel';
import { CollaborationModel, NodeModel } from './core';
import {
  PageAttributes,
  PageCollaborationAttributes,
  pageCollaborationModel,
  pageModel,
} from './page';
import {
  ChatAttributes,
  ChatCollaborationAttributes,
  chatCollaborationModel,
  chatModel,
} from './chat';
import {
  SpaceAttributes,
  SpaceCollaborationAttributes,
  spaceCollaborationModel,
  spaceModel,
} from './space';
import {
  UserAttributes,
  UserCollaborationAttributes,
  userCollaborationModel,
  userModel,
} from './user';
import {
  MessageAttributes,
  MessageCollaborationAttributes,
  messageCollaborationModel,
  messageModel,
} from './message';
import {
  DatabaseAttributes,
  DatabaseCollaborationAttributes,
  databaseCollaborationModel,
  databaseModel,
} from './database';
import {
  FileAttributes,
  FileCollaborationAttributes,
  fileCollaborationModel,
  fileModel,
} from './file';
import {
  FolderAttributes,
  FolderCollaborationAttributes,
  folderCollaborationModel,
  folderModel,
} from './folder';
import {
  recordCollaborationModel,
  RecordAttributes,
  RecordCollaborationAttributes,
  recordModel,
} from './record';
import {
  WorkspaceAttributes,
  WorkspaceCollaborationAttributes,
  workspaceCollaborationModel,
  workspaceModel,
} from './workspace';

type NodeBase = {
  id: string;
  parentId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  transactionId: string;
};

export type CollaborationBase = {
  userId: string;
  nodeId: string;
  type: NodeType;
  createdAt: string;
  createdBy: string | null;
  removedAt: string | null;
};

export type ChannelNode = NodeBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChannelCollaboration = CollaborationBase & {
  type: 'channel';
  attributes: ChannelCollaborationAttributes;
};

export type ChatNode = NodeBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type ChatCollaboration = CollaborationBase & {
  type: 'chat';
  attributes: ChatCollaborationAttributes;
};

export type DatabaseNode = NodeBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type DatabaseCollaboration = CollaborationBase & {
  type: 'database';
  attributes: DatabaseCollaborationAttributes;
};

export type FileNode = NodeBase & {
  type: 'file';
  attributes: FileAttributes;
};

export type FileCollaboration = CollaborationBase & {
  type: 'file';
  attributes: FileCollaborationAttributes;
};

export type FolderNode = NodeBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type FolderCollaboration = CollaborationBase & {
  type: 'folder';
  attributes: FolderCollaborationAttributes;
};

export type MessageNode = NodeBase & {
  type: 'message';
  attributes: MessageAttributes;
};

export type MessageCollaboration = CollaborationBase & {
  type: 'message';
  attributes: MessageCollaborationAttributes;
};

export type PageNode = NodeBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type PageCollaboration = CollaborationBase & {
  type: 'page';
  attributes: PageCollaborationAttributes;
};

export type RecordNode = NodeBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type RecordCollaboration = CollaborationBase & {
  type: 'record';
  attributes: RecordCollaborationAttributes;
};

export type SpaceNode = NodeBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type SpaceCollaboration = CollaborationBase & {
  type: 'space';
  attributes: SpaceCollaborationAttributes;
};

export type UserNode = NodeBase & {
  type: 'user';
  attributes: UserAttributes;
};

export type UserCollaboration = CollaborationBase & {
  type: 'user';
  attributes: UserCollaborationAttributes;
};

export type WorkspaceNode = NodeBase & {
  type: 'workspace';
  attributes: WorkspaceAttributes;
};

export type WorkspaceCollaboration = CollaborationBase & {
  type: 'workspace';
  attributes: WorkspaceCollaborationAttributes;
};

export type NodeType =
  | 'channel'
  | 'chat'
  | 'database'
  | 'file'
  | 'folder'
  | 'message'
  | 'page'
  | 'record'
  | 'space'
  | 'user'
  | 'workspace';

export type NodeAttributes =
  | UserAttributes
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FileAttributes
  | FolderAttributes
  | MessageAttributes
  | PageAttributes
  | RecordAttributes
  | WorkspaceAttributes;

export type Node =
  | ChannelNode
  | ChatNode
  | DatabaseNode
  | FileNode
  | FolderNode
  | MessageNode
  | PageNode
  | RecordNode
  | SpaceNode
  | UserNode
  | WorkspaceNode;

export type CollaborationAttributes =
  | UserCollaborationAttributes
  | SpaceCollaborationAttributes
  | DatabaseCollaborationAttributes
  | ChannelCollaborationAttributes
  | ChatCollaborationAttributes
  | FileCollaborationAttributes
  | FolderCollaborationAttributes
  | MessageCollaborationAttributes
  | PageCollaborationAttributes
  | RecordCollaborationAttributes
  | WorkspaceCollaborationAttributes;

export type Collaboration =
  | UserCollaboration
  | SpaceCollaboration
  | DatabaseCollaboration
  | ChannelCollaboration
  | ChatCollaboration
  | FileCollaboration
  | FolderCollaboration
  | MessageCollaboration
  | PageCollaboration
  | RecordCollaboration
  | WorkspaceCollaboration;

class Registry {
  private nodeModels: Map<string, NodeModel> = new Map();
  private collaborationModels: Map<string, CollaborationModel> = new Map();

  constructor() {
    this.nodeModels.set('channel', channelModel);
    this.collaborationModels.set('channel', channelCollaborationModel);

    this.nodeModels.set('chat', chatModel);
    this.collaborationModels.set('chat', chatCollaborationModel);

    this.nodeModels.set('database', databaseModel);
    this.collaborationModels.set('database', databaseCollaborationModel);

    this.nodeModels.set('file', fileModel);
    this.collaborationModels.set('file', fileCollaborationModel);

    this.nodeModels.set('folder', folderModel);
    this.collaborationModels.set('folder', folderCollaborationModel);

    this.nodeModels.set('message', messageModel);
    this.collaborationModels.set('message', messageCollaborationModel);

    this.nodeModels.set('page', pageModel);
    this.collaborationModels.set('page', pageCollaborationModel);

    this.nodeModels.set('record', recordModel);
    this.collaborationModels.set('record', recordCollaborationModel);

    this.nodeModels.set('space', spaceModel);
    this.collaborationModels.set('space', spaceCollaborationModel);

    this.nodeModels.set('user', userModel);
    this.collaborationModels.set('user', userCollaborationModel);

    this.nodeModels.set('workspace', workspaceModel);
    this.collaborationModels.set('workspace', workspaceCollaborationModel);
  }

  getNodeModel(type: string): NodeModel {
    const model = this.nodeModels.get(type);
    if (!model) {
      throw new Error(`Model for type ${type} not found`);
    }

    return model;
  }

  getCollaborationModel(type: string): CollaborationModel {
    const model = this.collaborationModels.get(type);
    if (!model) {
      throw new Error(`Model for type ${type} not found`);
    }

    return model;
  }
}

export const registry = new Registry();
