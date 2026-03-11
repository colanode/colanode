import { LocalNode } from '@colanode/client/types/nodes';

export const NODE_TYPE_LABELS: Record<string, string> = {
  channel: 'Channel',
  page: 'Page',
  folder: 'Folder',
  database: 'Database',
  database_view: 'View',
  file: 'File',
  record: 'Record',
};

export const getNodeDisplayName = (node: LocalNode): string => {
  switch (node.type) {
    case 'chat':
      return 'Chat';
    case 'message':
      return node.name ?? 'Message';
    default:
      return node.name;
  }
};
