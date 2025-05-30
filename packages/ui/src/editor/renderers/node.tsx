import { JSONContent } from '@tiptap/core';
import { ReactElement } from 'react';
import { match } from 'ts-pattern';

import { BlockquoteRenderer } from '@colanode/ui/editor/renderers/blockquote';
import { BulletListRenderer } from '@colanode/ui/editor/renderers/bullet-list';
import { CodeBlockRenderer } from '@colanode/ui/editor/renderers/code-block';
import { DocumentRenderer } from '@colanode/ui/editor/renderers/document';
import { FileRenderer } from '@colanode/ui/editor/renderers/file';
import { Heading1Renderer } from '@colanode/ui/editor/renderers/heading1';
import { Heading2Renderer } from '@colanode/ui/editor/renderers/heading2';
import { Heading3Renderer } from '@colanode/ui/editor/renderers/heading3';
import { ListItemRenderer } from '@colanode/ui/editor/renderers/list-item';
import { MarkRenderer } from '@colanode/ui/editor/renderers/mark';
import { MentionRenderer } from '@colanode/ui/editor/renderers/mention';
import { MessageRenderer } from '@colanode/ui/editor/renderers/message';
import { OrderedListRenderer } from '@colanode/ui/editor/renderers/ordered-list';
import { ParagraphRenderer } from '@colanode/ui/editor/renderers/paragraph';
import { TaskItemRenderer } from '@colanode/ui/editor/renderers/task-item';
import { TaskListRenderer } from '@colanode/ui/editor/renderers/task-list';
import { TextRenderer } from '@colanode/ui/editor/renderers/text';

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
        .with('mention', () => (
          <MentionRenderer node={node} keyPrefix={keyPrefix} />
        ))
        .otherwise(() => null)}
    </MarkRenderer>
  );
};
