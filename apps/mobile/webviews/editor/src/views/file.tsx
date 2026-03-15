import type { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import { Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';

import { postNavigateNode } from '../bridge';

interface FileData {
  name: string;
  subtype: string;
  mimeType: string;
}

interface LocalFileData {
  url: string | null;
  downloadStatus: number;
}

export const MobileFileNodeView = ({ node }: NodeViewProps) => {
  const id = node.attrs.id;
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [localFile, setLocalFile] = useState<LocalFileData | null>(null);

  // Query for the file node metadata
  useEffect(() => {
    if (!id) return;

    window.colanode
      .executeQuery({
        type: 'node.list',
        userId: '',
        filters: [{ field: ['id'], operator: 'eq', value: id }],
        sorts: [],
        limit: 1,
      })
      .then((nodes) => {
        if (nodes && nodes.length > 0) {
          const n = nodes[0] as {
            name?: string;
            subtype?: string;
            mimeType?: string;
          };
          setFileData({
            name: n.name || 'Unnamed file',
            subtype: n.subtype || '',
            mimeType: n.mimeType || '',
          });
        } else {
          setFileData({ name: 'Unnamed file', subtype: '', mimeType: '' });
        }
      })
      .catch(() => {
        setFileData({ name: 'Unnamed file', subtype: '', mimeType: '' });
      });
  }, [id]);

  // If it's a previewable file, query for the local file URL
  useEffect(() => {
    if (!id || !fileData) return;
    if (
      fileData.subtype !== 'image' &&
      fileData.subtype !== 'video' &&
      fileData.subtype !== 'audio'
    ) {
      return;
    }

    window.colanode
      .executeQuery({
        type: 'local.file.get',
        fileId: id,
        userId: '',
        autoDownload: true,
      })
      .then((result) => {
        if (result) {
          const lf = result as {
            url?: string;
            path?: string;
            downloadStatus?: number;
          };
          setLocalFile({
            url: lf.url || (lf.path ? `file://${lf.path}` : null),
            downloadStatus: lf.downloadStatus ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [id, fileData]);

  if (!id) return null;

  const isImage = fileData?.subtype === 'image';
  const hasPreview = isImage && localFile?.url;

  return (
    <NodeViewWrapper data-id={node.attrs.id}>
      <div
        className="my-0.5 w-full cursor-pointer rounded-md hover:bg-accent active:bg-accent"
        onClick={() => postNavigateNode(id, 'file')}
      >
        {hasPreview ? (
          <div className="flex max-h-72 w-full items-center justify-center overflow-hidden rounded-md p-2">
            <img
              src={localFile.url!}
              alt={fileData.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-10 flex-row items-center gap-2 p-2">
            <Paperclip
              size={18}
              className="text-muted-foreground shrink-0"
            />
            <span className="truncate">
              {fileData?.name ?? 'Loading...'}
            </span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
