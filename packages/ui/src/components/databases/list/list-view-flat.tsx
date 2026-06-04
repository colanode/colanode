import { Plus } from 'lucide-react';
import { InView } from 'react-intersection-observer';

import { extractNodeRole } from '@colanode/core';
import { ListViewRecordRow } from '@colanode/ui/components/databases/list/list-view-record-row';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

export const ListViewFlat = () => {
    const workspace = useWorkspace();
    const database = useDatabase();
    const view = useDatabaseView();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useRecordsQuery(view.filters, view.sorts);
    const records = data;

    return (
        <>
            {records.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No records</p>
            )}
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
                    onClick={() => view.createRecord()}
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
    );
};
