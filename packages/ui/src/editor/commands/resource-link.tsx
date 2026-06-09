import { Link2 } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

export const ResourceLinkCommand: EditorCommand = {
    key: 'resourceLink',
    name: 'Resource link',
    description: 'Link to a page, channel, database…',
    keywords: ['link', 'resource', 'reference', 'mention', '[['],
    icon: Link2,
    disabled: false,
    handler: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertContent('[[').run();
    },
};
