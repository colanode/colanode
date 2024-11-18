import { NodeRenderer } from '@/renderer/editor/renderers/node';
import { mapBlocksToContents } from '@/shared/lib/editor';
import { MessageNode } from '@colanode/core';

interface MessageContentProps {
  message: MessageNode;
}

export const MessageContent = ({ message }: MessageContentProps) => {
  const nodeBlocks = Object.values(message.attributes.content ?? {});
  const contents = mapBlocksToContents(message.id, nodeBlocks);

  return (
    <div className="text-foreground">
      {contents.map((node) => (
        <NodeRenderer
          key={node.attrs?.id}
          node={node}
          keyPrefix={node.attrs?.id}
        />
      ))}
    </div>
  );
};
