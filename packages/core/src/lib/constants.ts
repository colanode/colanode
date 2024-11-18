export const NodeTypes = {
  User: 'user',
  Space: 'space',
  Workspace: 'workspace',
  Page: 'page',
  Channel: 'channel',
  Chat: 'chat',
  Message: 'message',
  Database: 'database',
  DatabaseReplica: 'databaseReplica',
  Record: 'record',
  Folder: 'folder',
  File: 'file',
};

export const EditorNodeTypes = {
  Paragraph: 'paragraph',
  Heading1: 'heading1',
  Heading2: 'heading2',
  Heading3: 'heading3',
  Blockquote: 'blockquote',
  BulletList: 'bulletList',
  CodeBlock: 'codeBlock',
  ListItem: 'listItem',
  OrderedList: 'orderedList',
  TaskList: 'taskList',
  TaskItem: 'taskItem',
  HorizontalRule: 'horizontalRule',
  Page: 'page',
  File: 'file',
  Folder: 'folder',
  FilePlaceholder: 'filePlaceholder',
};

export type SortDirection = 'asc' | 'desc';

export const NodeRoles = {
  Admin: 'admin',
  Editor: 'editor',
  Collaborator: 'collaborator',
  Viewer: 'viewer',
};
