import { Plus } from 'lucide-react';

import { ViewBooleanFieldFilter } from '@/renderer/components/databases/search/view-boolean-field-filter';
import { ViewCreatedAtFieldFilter } from '@/renderer/components/databases/search/view-created-at-field-fitler';
import { ViewDateFieldFilter } from '@/renderer/components/databases/search/view-date-field-filter';
import { ViewEmailFieldFilter } from '@/renderer/components/databases/search/view-email-field-filter';
import { ViewFilterAddPopover } from '@/renderer/components/databases/search/view-filter-add-popover';
import { ViewMultiSelectFieldFilter } from '@/renderer/components/databases/search/view-multi-select-field-filter';
import { ViewNumberFieldFilter } from '@/renderer/components/databases/search/view-number-field-filter';
import { ViewPhoneFieldFilter } from '@/renderer/components/databases/search/view-phone-field-filter';
import { ViewSelectFieldFilter } from '@/renderer/components/databases/search/view-select-field-filter';
import { ViewTextFieldFilter } from '@/renderer/components/databases/search/view-text-field-filter';
import { ViewUrlFieldFilter } from '@/renderer/components/databases/search/view-url-field-filter';
import { useDatabase } from '@/renderer/contexts/database';
import { useView } from '@/renderer/contexts/view';

export const ViewFilters = () => {
  const database = useDatabase();
  const view = useView();

  return (
    <div className="flex flex-row items-center gap-2">
      {view.filters &&
        view.filters.map((filter) => {
          if (filter.type === 'group') {
            return null;
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
              return null;
            case 'createdAt':
              return (
                <ViewCreatedAtFieldFilter
                  key={filter.id}
                  field={field}
                  filter={filter}
                />
              );
            case 'createdBy':
              return null;
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
            case 'multiSelect':
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
