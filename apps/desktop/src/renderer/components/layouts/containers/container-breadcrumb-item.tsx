import { LocalNode } from '@colanode/client/types';

import { ChannelBreadcrumbItem } from '@/renderer/components/channels/channel-breadcrumb-item';
import { ChatBreadcrumbItem } from '@/renderer/components/chats/chat-breadcrumb-item';
import { DatabaseBreadcrumbItem } from '@/renderer/components/databases/database-breadcrumb-item';
import { FolderBreadcrumbItem } from '@/renderer/components/folders/folder-breadcrumb-item';
import { PageBreadcrumbItem } from '@/renderer/components/pages/page-breadcrumb-item';
import { RecordBreadcrumbItem } from '@/renderer/components/records/record-breadcrumb-item';
import { SpaceBreadcrumbItem } from '@/renderer/components/spaces/space-breadcrumb-item';
import { FileBreadcrumbItem } from '@/renderer/components/files/file-breadcrumb-item';
import { MessageBreadcrumbItem } from '@/renderer/components/messages/message-breadcrumb-item';

interface ContainerBreadcrumbItemProps {
  node: LocalNode;
}

export const ContainerBreadcrumbItem = ({
  node,
}: ContainerBreadcrumbItemProps) => {
  switch (node.type) {
    case 'space':
      return <SpaceBreadcrumbItem space={node} />;
    case 'channel':
      return <ChannelBreadcrumbItem channel={node} />;
    case 'chat':
      return <ChatBreadcrumbItem chat={node} />;
    case 'page':
      return <PageBreadcrumbItem page={node} />;
    case 'database':
      return <DatabaseBreadcrumbItem database={node} />;
    case 'record':
      return <RecordBreadcrumbItem record={node} />;
    case 'folder':
      return <FolderBreadcrumbItem folder={node} />;
    case 'file':
      return <FileBreadcrumbItem file={node} />;
    case 'message':
      return <MessageBreadcrumbItem message={node} />;
    default:
      return null;
  }
};
