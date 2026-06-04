import { Plus } from 'lucide-react';
import { Fragment } from 'react';
import { InView } from 'react-intersection-observer';

import { extractNodeRole } from '@colanode/core';
import { GalleryViewRecordCard } from '@colanode/ui/components/databases/gallery/gallery-view-record-card';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { ViewBasicSettings } from '@colanode/ui/components/databases/view-basic-settings';
import { ViewFullscreenButton } from '@colanode/ui/components/databases/view-fullscreen-button';
import { ViewTabs } from '@colanode/ui/components/databases/view-tabs';
import { RecordProvider } from '@colanode/ui/components/records/record-provider';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useRecordsQuery } from '@colanode/ui/hooks/use-records-query';

export const GalleryView = () => {
    const workspace = useWorkspace();
    const database = useDatabase();
    const view = useDatabaseView();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useRecordsQuery(view.filters, view.sorts);
    const records = data;

    return (
        <Fragment>
            <div className="flex flex-row justify-between border-b">
                <ViewTabs />
                <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
                    <ViewFullscreenButton />
                    <ViewBasicSettings />
                    <ViewSortButton />
                    <ViewFilterButton />
                </div>
            </div>
            <ViewSearchBar />
            <div className="mt-2 w-full overflow-auto pr-5 pb-4">
                {records.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">No records</p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {records.map((record) => {
                        const role =
                            extractNodeRole(record, workspace.userId) ?? database.role;

                        return (
                            <RecordProvider key={record.id} record={record} role={role}>
                                <GalleryViewRecordCard />
                            </RecordProvider>
                        );
                    })}
                    {database.canCreateRecord && (
                        <button
                            type="button"
                            className="animate-fade-in flex min-h-20 cursor-pointer flex-row items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-accent"
                            onClick={() => view.createRecord()}
                        >
                            <Plus className="size-4" />
                            <span className="text-sm">Add record</span>
                        </button>
                    )}
                </div>
                <InView
                    rootMargin="200px"
                    onChange={(inView) => {
                        if (inView && hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                ></InView>
            </div>
        </Fragment>
    );
};
