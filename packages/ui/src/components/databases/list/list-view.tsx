import { Fragment } from 'react';

import {
    MultiSelectFieldAttributes,
    SelectFieldAttributes,
} from '@colanode/core';
import { ListViewFlat } from '@colanode/ui/components/databases/list/list-view-flat';
import { ListViewGrouped } from '@colanode/ui/components/databases/list/list-view-grouped';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { ViewBasicSettings } from '@colanode/ui/components/databases/view-basic-settings';
import { ViewFullscreenButton } from '@colanode/ui/components/databases/view-fullscreen-button';
import { ViewTabs } from '@colanode/ui/components/databases/view-tabs';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const ListView = () => {
    const database = useDatabase();
    const view = useDatabaseView();

    const groupByField = database.fields.find(
        (field) => field.id === view.groupBy
    );
    const isGrouped =
        groupByField?.type === 'select' ||
        groupByField?.type === 'multi_select';

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
            <div className="mt-2 w-full overflow-auto pr-5">
                {isGrouped ? (
                    <ListViewGrouped
                        field={
                            groupByField as
                            | SelectFieldAttributes
                            | MultiSelectFieldAttributes
                        }
                    />
                ) : (
                    <ListViewFlat />
                )}
            </div>
        </Fragment>
    );
};
