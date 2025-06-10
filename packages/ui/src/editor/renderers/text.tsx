import { JSONContent } from '@tiptap/core';
import { Fragment } from 'react';

interface TextRendererProps {
  node: JSONContent;
}

export const TextRenderer = ({ node }: TextRendererProps) => {
  return <Fragment>{node.text ?? ''}</Fragment>;
};
