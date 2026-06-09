import { Calendar } from 'lucide-react';

import { EditorCommand } from '@colanode/client/types';

const pad = (n: number) => n.toString().padStart(2, '0');

const formatToday = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const DateCommand: EditorCommand = {
    key: 'date',
    name: 'Today',
    description: "Insert today's date",
    keywords: ['date', 'today', 'time'],
    icon: Calendar,
    disabled: false,
    handler: ({ editor, range }) => {
        editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(formatToday())
            .run();
    },
};
