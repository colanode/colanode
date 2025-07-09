import { Plus } from 'lucide-react';

import { SpecialId } from '@colanode/core';
import { ViewBooleanFieldFilter } from '@colanode/ui/components/databases/search/view-boolean-field-filter';
import { ViewCollaboratorFieldFilter } from '@colanode/ui/components/databases/search/view-collaborator-field-filter';
import { ViewCreatedAtFieldFilter } from '@colanode/ui/components/databases/search/view-created-at-field-fitler';
import { ViewCreatedByFieldFilter } from '@colanode/ui/components/databases/search/view-created-by-field-filter';
import { ViewDateFieldFilter } from '@colanode/ui/components/databases/search/view-date-field-filter';
import { ViewEmailFieldFilter } from '@colanode/ui/components/databases/search/view-email-field-filter';
import { ViewFilterAddPopover } from '@colanode/ui/components/databases/search/view-filter-add-popover';
import { ViewMultiSelectFieldFilter } from '@colanode/ui/components/databases/search/view-multi-select-field-filter';
import { ViewNameFieldFilter } from '@colanode/ui/components/databases/search/view-name-field-filter';
import { ViewNumberFieldFilter } from '@colanode/ui/components/databases/search/view-number-field-filter';
import { ViewPhoneFieldFilter } from '@colanode/ui/components/databases/search/view-phone-field-filter';
import { ViewSelectFieldFilter } from '@colanode/ui/components/databases/search/view-select-field-filter';
import { ViewTextFieldFilter } from '@colanode/ui/components/databases/search/view-text-field-filter';
import { ViewUpdatedAtFieldFilter } from '@colanode/ui/components/databases/search/view-updated-at-field-filter';
import { ViewUpdatedByFieldFilter } from '@colanode/ui/components/databases/search/view-updated-by-field-filter';
import { ViewUrlFieldFilter } from '@colanode/ui/components/databases/search/view-url-field-filter';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const ViewFilters = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  return (
    <div className="flex flex-row items-center gap-2">
      {view.filters &&
        view.filters.map((filter) => {
          if (filter.type === 'group') {
            return null;
          }

          if (filter.fieldId === SpecialId.Name) {
            return <ViewNameFieldFilter key={filter.id} filter={filter} />;
          }

          const field = database.fields.find(
            (field) => field.id === filter.fieldId
          );

          if (!field) {
            return null;
          }

          switch (field.type) {
            case 'boolean':
              return (
                <ViewBooleanFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'collaborator':
              return (
                <ViewCollaboratorFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'created_at':
              return (
                <ViewCreatedAtFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'created_by':
              return (
                <ViewCreatedByFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'date':
              return (
                <ViewDateFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'email':
              return (
                <ViewEmailFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'file':
              return null;
            case 'multi_select':
              return (
                <ViewMultiSelectFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'number':
              return (
                <ViewNumberFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'phone':
              return (
                <ViewPhoneFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'select':
              return (
                <ViewSelectFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'text':
              return (
                <ViewTextFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );

            case 'url':
              return (
                <ViewUrlFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'updated_at':
              return (
                <ViewUpdatedAtFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'updated_by':
              return (
                <ViewUpdatedByFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );

            default:
              return null;
          }
        })}
      <ViewFilterAddPopover>
        <button className="flex cursor-pointer flex-row items-center gap-1 rounded-lg p-1 text-sm text-muted-foreground hover:bg-gray-50">
          <Plus className="size-4" />
          Add filter
        </button>
      </ViewFilterAddPopover>
    </div>
  );
};
