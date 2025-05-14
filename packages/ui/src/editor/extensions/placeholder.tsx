import { Placeholder, PlaceholderOptions } from '@tiptap/extension-placeholder';

interface PlaceholderProps extends PlaceholderOptions {
  message: string;
}

export const PlaceholderExtension =
  Placeholder.extend<PlaceholderProps>().configure({
    placeholder: ({ node, editor }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level}`;
      }

      if (node.type.name === 'paragraph') {
        const extension = editor.extensionManager.extensions.find(
          (f) => f.name === 'placeholder'
        );
        if (extension) {
          const { message } = extension.options as PlaceholderProps;
          return message;
        }
      }

      return '';
    },
    showOnlyCurrent: true,
    showOnlyWhenEditable: true,
    includeChildren: false,
  });
