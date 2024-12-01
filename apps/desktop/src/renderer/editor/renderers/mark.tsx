import { JSONContent } from '@tiptap/core';
import React from 'react';

import { defaultClasses } from '@/renderer/editor/classes';

interface MarkRendererProps {
  node: JSONContent;
  children: React.ReactNode | React.ReactNode[];
}

export const MarkRenderer = ({ node, children }: MarkRendererProps) => {
  let result = <React.Fragment>{children}</React.Fragment>;

  if (node.marks && node.marks.length > 0) {
    node.marks.forEach((mark) => {
      if (mark.type === 'bold') {
        result = <strong>{result}</strong>;
      } else if (mark.type === 'italic') {
        result = <em>{result}</em>;
      } else if (mark.type === 'underline') {
        result = <u>{result}</u>;
      } else if (mark.type === 'strike') {
        result = <s>{result}</s>;
      } else if (mark.type === 'code') {
        result = <code className={defaultClasses.code}>{result}</code>;
      } else if (mark.type === 'color' && mark.attrs?.color) {
        result = (
          <span className={`text-${mark.attrs.color}-600`}>{result}</span>
        );
      } else if (mark.type === 'highlight' && mark.attrs?.highlight) {
        result = (
          <span className={`bg-${mark.attrs.highlight}-200`}>{result}</span>
        );
      } else if (mark.type === 'link' && mark.attrs?.href) {
        result = (
          <a
            href={mark.attrs.href}
            target="_blank"
            className={defaultClasses.link}
            rel="noreferrer"
          >
            {result}
          </a>
        );
      }
    });
  }

  return result;
};
