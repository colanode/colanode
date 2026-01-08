import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension, JSONContent } from '@tiptap/react';

export const ParserExtension = Extension.create({
  name: 'parser',
  addOptions() {
    return {
      nodes: [],
    };
  },
  addProseMirrorPlugins() {
    const editor = this.editor;
    const markdown = editor.markdown;

    if (!markdown) {
      console.error('Markdown extension not found');
      return [];
    }

    return [
      new Plugin({
        key: new PluginKey('parser'),
        props: {
          handlePaste(view, event) {
            const html = event.clipboardData?.getData('text/html');
            if (html) {
              return false;
            }

            const text = event.clipboardData?.getData('text/plain');
            if (!text) {
              return false;
            }

            const parsedContent = markdown.parse(text);
            if (!parsedContent || !parsedContent.content) {
              return false;
            }

            const blocks = parsedContent.content;
            if (!blocks || blocks.length === 0) {
              return false;
            }

            const normalizedBlocks = normalizeHeadings(blocks);
            editor.commands.insertContent(normalizedBlocks);
            return true;
          },
        },
      }),
    ];
  },
});

const normalizeHeadings = (content: JSONContent[]): JSONContent[] => {
  return content.map(normalizeNode);
};

const normalizeNode = (node: JSONContent): JSONContent => {
  if (node.type === 'heading' && node.attrs?.level) {
    const level = node.attrs.level;
    let newType: string;

    if (level === 1) {
      newType = 'heading1';
    } else if (level === 2) {
      newType = 'heading2';
    } else {
      newType = 'heading3';
    }

    const { level: _, ...restAttrs } = node.attrs;
    return {
      ...node,
      type: newType,
      attrs: Object.keys(restAttrs).length > 0 ? restAttrs : undefined,
      content: node.content ? node.content.map(normalizeNode) : undefined,
    };
  }

  if (node.content) {
    return {
      ...node,
      content: node.content.map(normalizeNode),
    };
  }

  return node;
};
