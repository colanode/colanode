import { JSONContent } from '@tiptap/core';
import { Fragment, useMemo } from 'react';

import { useSearchHighlight } from '@colanode/ui/contexts/search-highlight';

interface TextRendererProps {
  node: JSONContent;
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const TextRenderer = ({ node }: TextRendererProps) => {
  const { terms } = useSearchHighlight();
  const text = node.text ?? '';

  const segments = useMemo(() => {
    if (text.length === 0 || terms.length === 0) {
      return null;
    }

    const cleanedTerms = Array.from(
      new Set(terms.map((t) => t.trim()).filter((t) => t.length > 0))
    );

    if (cleanedTerms.length === 0) {
      return null;
    }

    const pattern = new RegExp(
      `(${cleanedTerms.map(escapeRegExp).join('|')})`,
      'gi'
    );

    const parts = text.split(pattern);
    if (parts.length === 1) {
      return null;
    }

    return parts;
  }, [text, terms]);

  if (segments == null) {
    return <Fragment>{text}</Fragment>;
  }

  return (
    <Fragment>
      {segments.map((segment, index) => {
        if (segment.length === 0) {
          return null;
        }

        const isMatch = index % 2 === 1;

        if (!isMatch) {
          return <Fragment key={index}>{segment}</Fragment>;
        }

        return (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40"
          >
            {segment}
          </mark>
        );
      })}
    </Fragment>
  );
};
