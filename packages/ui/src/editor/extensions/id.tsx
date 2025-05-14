import { EditorNodeTypes, generateId, IdType } from '@colanode/core';
import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';

const types = [
  EditorNodeTypes.Paragraph,
  EditorNodeTypes.Heading1,
  EditorNodeTypes.Heading2,
  EditorNodeTypes.Heading3,
  EditorNodeTypes.Blockquote,
  EditorNodeTypes.BulletList,
  EditorNodeTypes.ListItem,
  EditorNodeTypes.OrderedList,
  EditorNodeTypes.TaskList,
  EditorNodeTypes.TaskItem,
  EditorNodeTypes.CodeBlock,
  EditorNodeTypes.HorizontalRule,
];

export const IdExtension = Extension.create({
  name: 'id',
  priority: 10000,
  addGlobalAttributes() {
    return [
      {
        types,
        attributes: {
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-id'),
            renderHTML: (attrs) => {
              if (!attrs.id) {
                return {};
              }

              return {
                'data-id': attrs.id,
              };
            },
            rendered: true,
            keepOnSplit: false,
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('id'),
        appendTransaction(_, __, state) {
          const { tr } = state;
          const ids = new Set<string>();
          state.doc.descendants((node, pos) => {
            if (node.isText) {
              return; // Text nodes don't need IDs
            }

            if (!node.attrs.id || typeof node.attrs.id !== 'string') {
              const id = generateId(IdType.Block);
              ids.add(id);
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                id,
              });
            } else {
              let id = node.attrs.id;
              if (ids.has(id)) {
                id = generateId(IdType.Block);
                ids.add(id);
                tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  id,
                });
              } else {
                ids.add(id);
              }
            }
          });
          return tr;
        },
      }),
    ];
  },
});
