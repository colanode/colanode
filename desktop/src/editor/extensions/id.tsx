import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { NeuronId } from '@/lib/id';

const types = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'listItem',
  'orderedList',
  'taskList',
  'taskItem',
  'codeBlock',
  'divider',
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
          state.doc.descendants((node, pos) => {
            if (node.isText) {
              return; // Text nodes don't need IDs
            }

            if (!node.attrs.id || typeof node.attrs.id !== 'string') {
              tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                id: NeuronId.generate(NeuronId.getIdTypeFromNode(node.type.name)),
              });
            }
          });
          return tr;
        },
      }),
    ];
  },
});