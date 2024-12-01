import { JSONContent } from '@tiptap/core';
import { ReactElement } from 'react';
import { match } from 'ts-pattern';

import { BlockquoteRenderer } from '@/renderer/editor/renderers/blockquote';
import { BulletListRenderer } from '@/renderer/editor/renderers/bullet-list';
import { CodeBlockRenderer } from '@/renderer/editor/renderers/code-block';
import { DocumentRenderer } from '@/renderer/editor/renderers/document';
import { FileRenderer } from '@/renderer/editor/renderers/file';
import { Heading1Renderer } from '@/renderer/editor/renderers/heading1';
import { Heading2Renderer } from '@/renderer/editor/renderers/heading2';
import { Heading3Renderer } from '@/renderer/editor/renderers/heading3';
import { ListItemRenderer } from '@/renderer/editor/renderers/list-item';
import { MarkRenderer } from '@/renderer/editor/renderers/mark';
import { MessageRenderer } from '@/renderer/editor/renderers/message';
import { OrderedListRenderer } from '@/renderer/editor/renderers/ordered-list';
import { ParagraphRenderer } from '@/renderer/editor/renderers/paragraph';
import { TaskItemRenderer } from '@/renderer/editor/renderers/task-item';
import { TaskListRenderer } from '@/renderer/editor/renderers/task-list';
import { TextRenderer } from '@/renderer/editor/renderers/text';

interface NodeRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const NodeRenderer = ({
  node,
  keyPrefix,
}: NodeRendererProps): ReactElement => {
  return (
    <MarkRenderer node={node}>
      {match(node.type)
        .with('message', () => (
          <MessageRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('doc', () => (
          <DocumentRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('text', () => <TextRenderer node={node} />)
        .with('paragraph', () => (
          <ParagraphRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('heading1', () => (
          <Heading1Renderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('heading2', () => (
          <Heading2Renderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('heading3', () => (
          <Heading3Renderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('blockquote', () => (
          <BlockquoteRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('bulletList', () => (
          <BulletListRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('orderedList', () => (
          <OrderedListRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('listItem', () => (
          <ListItemRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('taskList', () => (
          <TaskListRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('taskItem', () => (
          <TaskItemRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('codeBlock', () => (
          <CodeBlockRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .with('file', () => <FileRenderer node={node} keyPrefix={keyPrefix} />)
        .otherwise(() => null)}
    </MarkRenderer>
  );
};
