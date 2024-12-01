import { JSONContent } from '@tiptap/core';
import React from 'react';

interface TextRendererProps {
  node: JSONContent;
}

export const TextRenderer = ({ node }: TextRendererProps) => {
  return <React.Fragment>{node.text ?? ''}</React.Fragment>;
};
