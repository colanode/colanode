import { JSONContent } from '@tiptap/core';

interface HardBreakRendererProps {
  node: JSONContent;
  keyPrefix: string | null;
}

export const HardBreakRenderer = (_: HardBreakRendererProps) => {
  return <br />;
};
