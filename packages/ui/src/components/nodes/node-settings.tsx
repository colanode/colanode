import { LocalNode } from '@colanode/client/types';
import { NodeRole } from '@colanode/core';
import { ChannelSettings } from '@colanode/ui/components/channels/channel-settings';
import { NodeCollaboratorsPopover } from '@colanode/ui/components/collaborators/node-collaborators-popover';
import { DatabaseSettings } from '@colanode/ui/components/databases/database-settings';
import { FileSettings } from '@colanode/ui/components/files/file-settings';
import { FolderSettings } from '@colanode/ui/components/folders/folder-settings';
import { PageSettings } from '@colanode/ui/components/pages/page-settings';
import { RecordSettings } from '@colanode/ui/components/records/record-settings';

interface NodeSettingsProps {
  node: LocalNode;
  role: NodeRole;
}

export const NodeSettings = ({ node, role }: NodeSettingsProps) => {
  if (node.type === 'channel') {
    return <ChannelSettings channel={node} role={role} />;
  }

  if (node.type === 'chat') {
    return <NodeCollaboratorsPopover node={node} nodes={[node]} role={role} />;
  }

  if (node.type === 'database') {
    return <DatabaseSettings database={node} role={role} />;
  }

  if (node.type === 'folder') {
    return <FolderSettings folder={node} role={role} />;
  }

  if (node.type === 'file') {
    return <FileSettings file={node} role={role} />;
  }

  if (node.type === 'page') {
    return <PageSettings page={node} role={role} />;
  }

  if (node.type === 'record') {
    return <RecordSettings record={node} role={role} />;
  }

  return null;
};
