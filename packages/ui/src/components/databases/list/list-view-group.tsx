import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { InView } from 'react-intersection-observer';

import { DatabaseViewFilterAttributes, extractNodeRole } from '@colanode/core';
import { ListViewRecordRow } from '@colanode/ui/components/databases/list/list-view-record-row';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

interface ListViewGroupProps {
    header: ReactNode;
    filter: DatabaseViewFilterAttributes;
}

export const ListViewGroup = ({ header, filter }: ListViewGroupProps) => {
    const workspace = useWorkspace();
    const database = useDatabase();
    const view = useDatabaseView();

    const [open, setOpen] = useState(true);

    const filters = useMemo(
        () => [...view.filters, filter],
        [view.filters, filter]
    );

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useRecordsQuery(filters, view.sorts);
    const records = data;

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
                    <div className="flex flex-col border-t">
                        {records.map((record) => {
                            const role =
                                extractNodeRole(record, workspace.userId) ?? database.role;

                            return (
                                <RecordProvider key={record.id} record={record} role={role}>
                                    <ListViewRecordRow />
                                </RecordProvider>
                            );
                        })}
                    </div>
                    {database.canCreateRecord && (
                        <button
                            type="button"
                            className="animate-fade-in mt-1 flex h-9 w-full cursor-pointer flex-row items-center gap-1 rounded-md px-2 text-muted-foreground hover:bg-accent"
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
