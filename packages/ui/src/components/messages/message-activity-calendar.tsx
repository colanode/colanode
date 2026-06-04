import { CalendarDays } from 'lucide-react';
import { useMemo } from 'react';

import { Calendar } from '@colanode/ui/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { cn } from '@colanode/ui/lib/utils';

const toDateInputValue = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDay = (value: string): Date | null => {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    if (!year || !month || !day) {
        return null;
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

interface MessageActivityCalendarProps {
    selectedDay: string;
    onSelectDay: (day: string) => void;
}

export const MessageActivityCalendar = ({
    selectedDay,
    onSelectDay,
}: MessageActivityCalendarProps) => {
    const workspace = useWorkspace();
    const conversation = useConversation();

    const activityQuery = useQuery({
        type: 'message.activity-dates',
        userId: workspace.userId,
        conversationId: conversation.id,
    });

    const activeDates = useMemo(() => {
        const dates = (activityQuery.data ?? [])
            .map((day) => parseDay(day))
            .filter((date): date is Date => date != null);
        return dates;
    }, [activityQuery.data]);

    const selectedDate = useMemo(
        () => (selectedDay ? parseDay(selectedDay) : null),
        [selectedDay]
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs hover:bg-accent',
                        selectedDay ? 'text-foreground' : 'text-muted-foreground'
                    )}
                >
                    <CalendarDays className="size-4" />
                    <span>{selectedDay || 'Filter by date'}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate ?? undefined}
                    onSelect={(date) => {
                        onSelectDay(date ? toDateInputValue(date) : '');
                    }}
                    modifiers={{ hasData: activeDates }}
                    modifiersClassNames={{
                        hasData:
                            'relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary',
                    }}
                    autoFocus
                />
                {selectedDay && (
                    <div className="border-t border-border p-2">
                        <button
                            type="button"
                            className="w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                            onClick={() => onSelectDay('')}
                        >
                            Clear date filter
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
