import { Placeholder, PlaceholderOptions } from '@tiptap/extensions';

interface PlaceholderProps extends PlaceholderOptions {
  message: string;
  t?: (key: string) => string;
}

export const PlaceholderExtension =
  Placeholder.extend<PlaceholderProps>().configure({
    placeholder: ({ node, editor }) => {
      if (node.type.name === 'heading') {
        const extension = editor.extensionManager.extensions.find(
          (f) => f.name === 'placeholder'
        );
        const t = extension?.options?.t;
        if (t) {
          return `${t('common.edit')} ${node.attrs.level}`;
        }
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
