import { Node } from '@colanode/core';

import { ChannelBreadcrumbItem } from '@/renderer/components/channels/channel-breadcrumb-item';
import { ChatBreadcrumbItem } from '@/renderer/components/chats/chat-breadcrumb-item';
import { DatabaseBreadcrumbItem } from '@/renderer/components/databases/database-breadcrumb-item';
import { FileBreadcrumbItem } from '@/renderer/components/files/file-breadcrumb-item';
import { FolderBreadcrumbItem } from '@/renderer/components/folders/folder-breadcrumb-item';
import { MessageBreadcrumbItem } from '@/renderer/components/messages/message-breadcrumb-item';
import { PageBreadcrumbItem } from '@/renderer/components/pages/page-breadcrumb-item';
import { RecordBreadcrumbItem } from '@/renderer/components/records/record-breadcrumb-item';
import { SpaceBreadcrumbItem } from '@/renderer/components/spaces/space-breadcrumb-item';

interface NodeBreadcrumbItemProps {
  node: Node;
}

export const NodeBreadcrumbItem = ({ node }: NodeBreadcrumbItemProps) => {
  switch (node.type) {
    case 'space':
      return <SpaceBreadcrumbItem node={node} />;
    case 'channel':
      return <ChannelBreadcrumbItem node={node} />;
    case 'chat':
      return <ChatBreadcrumbItem node={node} />;
    case 'page':
      return <PageBreadcrumbItem node={node} />;
    case 'database':
      return <DatabaseBreadcrumbItem node={node} />;
    case 'record':
      return <RecordBreadcrumbItem node={node} />;
    case 'folder':
      return <FolderBreadcrumbItem node={node} />;
    case 'file':
      return <FileBreadcrumbItem node={node} />;
    case 'message':
      return <MessageBreadcrumbItem node={node} />;
    default:
      return null;
  }
};
