import { FileNode } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface FileBreadcrumbItemProps {
  node: FileNode;
}

export const FileBreadcrumbItem = ({ node }: FileBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar size="small" id={node.id} name={node.attributes.name} />
      <span>{node.attributes.name}</span>
    </div>
  );
};
