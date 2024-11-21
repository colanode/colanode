import React from 'react';
import { formatBytes } from '@/shared/lib/files';
import { formatDate } from '@/shared/lib/utils';
import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { FileNode } from '@colanode/core';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface FileSidebarProps {
  file: FileNode;
}

const FileMeta = ({ title, value }: { title: string; value: string }) => {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-foreground/80">{value}</p>
    </div>
  );
};

export const FileSidebar = ({ file }: FileSidebarProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'node_get',
    nodeId: file.createdBy,
    userId: workspace.userId,
  });

  const user = data?.type === 'user' ? data : null;

  return (
    <React.Fragment>
      <div className="flex items-center gap-x-4 p-2">
        <FileThumbnail
          file={file}
          className="h-12 w-9 min-w-[36px] overflow-hidden rounded object-contain"
        />
        <div
          className="line-clamp-3 break-words text-base font-medium"
          title={file.attributes.name}
        >
          {file.attributes.name}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <FileMeta title="Name" value={file.attributes.name} />
        <FileMeta title="Type" value={file.attributes.mimeType} />
        <FileMeta title="Size" value={formatBytes(file.attributes.size)} />
        <FileMeta title="Created at" value={formatDate(file.createdAt)} />

        {user && (
          <div>
            <p className="text-xs text-muted-foreground">Created by</p>
            <div className="mt-1 flex flex-row items-center gap-2">
              <Avatar
                id={user.id}
                name={user.attributes.name}
                avatar={user.attributes.avatar}
                className="h-8 w-8"
              />
              <p className="text-foreground/80">{user.attributes.name}</p>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};
