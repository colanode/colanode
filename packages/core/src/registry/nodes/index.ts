import { ChannelAttributes, channelModel } from './channel';
import { ChatAttributes, chatModel } from './chat';
import { DatabaseAttributes, databaseModel } from './database';
import { DatabaseViewAttributes, databaseViewModel } from './database-view';
import { FileAttributes, fileModel } from './file';
import { FolderAttributes, folderModel } from './folder';
import { MessageAttributes, messageModel } from './message';
import { PageAttributes, pageModel } from './page';
import { RecordAttributes, recordModel } from './record';
import { SpaceAttributes, spaceModel } from './space';

type NodeBase = {
  id: string;
  parentId: string;
  rootId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ChannelNode = NodeBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChatNode = NodeBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type DatabaseNode = NodeBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type DatabaseViewNode = NodeBase & {
  type: 'database_view';
  attributes: DatabaseViewAttributes;
};

export type FolderNode = NodeBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type PageNode = NodeBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type RecordNode = NodeBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type SpaceNode = NodeBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type MessageNode = NodeBase & {
  type: 'message';
  attributes: MessageAttributes;
};

export type FileNode = NodeBase & {
  type: 'file';
  attributes: FileAttributes;
};

export type NodeType = NodeAttributes['type'];

export type NodeAttributes =
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FolderAttributes
  | PageAttributes
  | RecordAttributes
  | MessageAttributes
  | FileAttributes
  | DatabaseViewAttributes;

export type Node =
  | SpaceNode
  | DatabaseNode
  | DatabaseViewNode
  | ChannelNode
  | ChatNode
  | FolderNode
  | PageNode
  | RecordNode
  | MessageNode
  | FileNode;

export const getNodeModel = (type: NodeType) => {
  switch (type) {
    case 'channel':
      return channelModel;
    case 'chat':
      return chatModel;
    case 'database':
      return databaseModel;
    case 'database_view':
      return databaseViewModel;
    case 'folder':
      return folderModel;
    case 'page':
      return pageModel;
    case 'record':
      return recordModel;
    case 'space':
      return spaceModel;
    case 'message':
      return messageModel;
    case 'file':
      return fileModel;
  }
};
