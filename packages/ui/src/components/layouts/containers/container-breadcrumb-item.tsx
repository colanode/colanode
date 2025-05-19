import { LocalNode } from '@colanode/client/types';
import { ChannelBreadcrumbItem } from '@colanode/ui/components/channels/channel-breadcrumb-item';
import { ChatBreadcrumbItem } from '@colanode/ui/components/chats/chat-breadcrumb-item';
import { DatabaseBreadcrumbItem } from '@colanode/ui/components/databases/database-breadcrumb-item';
import { FileBreadcrumbItem } from '@colanode/ui/components/files/file-breadcrumb-item';
import { FolderBreadcrumbItem } from '@colanode/ui/components/folders/folder-breadcrumb-item';
import { MessageBreadcrumbItem } from '@colanode/ui/components/messages/message-breadcrumb-item';
import { PageBreadcrumbItem } from '@colanode/ui/components/pages/page-breadcrumb-item';
import { RecordBreadcrumbItem } from '@colanode/ui/components/records/record-breadcrumb-item';
import { SpaceBreadcrumbItem } from '@colanode/ui/components/spaces/space-breadcrumb-item';

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
