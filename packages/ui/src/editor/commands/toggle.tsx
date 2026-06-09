import { ChevronRight } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

export const ToggleCommand: EditorCommand = {
    key: 'toggle',
    name: 'Toggle',
    description: 'Collapsible toggle block',
    keywords: ['toggle', 'collapse', 'fold', 'details'],
    icon: ChevronRight,
    disabled: false,
    handler: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setToggle().run();
    },
};
