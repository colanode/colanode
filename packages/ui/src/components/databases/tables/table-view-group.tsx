import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { DatabaseViewFilterAttributes } from '@colanode/core';
import { TableViewRow } from '@colanode/ui/components/databases/tables/table-view-row';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useCollectionQuery } from '@colanode/ui/hooks/use-collection-query';

interface TableViewGroupProps {
    header: ReactNode;
    filter: DatabaseViewFilterAttributes;
}

export const TableViewGroup = ({ header, filter }: TableViewGroupProps) => {
    const database = useDatabase();
    const view = useDatabaseView();

    const [open, setOpen] = useState(true);

    const filters = useMemo(
        () => [...view.filters, filter],
        [view.filters, filter]
    );

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useCollectionQuery(filters, view.sorts);
    const rows = data;

    return (
        <div className="flex flex-col">
            <div
                className="flex cursor-pointer flex-row items-center gap-2 py-1"
                onClick={() => setOpen((prev) => !prev)}
            >
                {open ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                )}
                {header}
            </div>
            {open && (
                <>
                    <div className="border-t">
                        {rows.map((row, index) => (
                            <TableViewRow key={row.id} index={index} row={row} />
                        ))}
                    </div>
                    {database.canCreateRecord && (
                        <button
                            type="button"
                            className="animate-fade-in flex h-8 w-full cursor-pointer flex-row items-center gap-1 border-b pl-2 text-muted-foreground hover:bg-accent"
                            onClick={() => view.createRecord([filter])}
                        >
                            <Plus className="size-4" />
                            <span className="text-sm">Add record</span>
                        </button>
                    )}
                    <InView
                        rootMargin="200px"
                        onChange={(inView) => {
                            if (inView && hasNextPage && !isFetchingNextPage) {
                                fetchNextPage();
                            }
                        }}
                    ></InView>
                </>
            )}
        </div>
    );
};
