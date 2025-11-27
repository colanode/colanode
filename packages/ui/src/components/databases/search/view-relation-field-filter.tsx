import { eq, inArray, useLiveQuery } from '@tanstack/react-db';
import { ChevronDown, Trash2, X } from 'lucide-react';

import { LocalRecordNode } from '@colanode/client/types';
import {
  DatabaseViewFieldFilterAttributes,
  RelationFieldAttributes,
} from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { RecordSearch } from '@colanode/ui/components/records/record-search';
import { Badge } from '@colanode/ui/components/ui/badge';
import { Button } from '@colanode/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useViewFilter } from '@colanode/ui/hooks/use-view-filter';
import { relationFieldFilterOperators } from '@colanode/ui/lib/databases';

interface ViewRelationFieldFilterProps {
  field: RelationFieldAttributes;
  filter: DatabaseViewFieldFilterAttributes;
}

const RelationBadge = ({ record }: { record: LocalRecordNode }) => {
  const name = record.name ?? 'Unnamed';
  return (
    <div className="flex flex-row items-center gap-1">
      <Avatar id={record.id} name={name} avatar={record.avatar} size="small" />
      <p className="text-sm line-clamp-1 w-full">{name}</p>
    </div>
  );
};

const isOperatorWithoutValue = (operator: string) => {
  return operator === 'is_empty' || operator === 'is_not_empty';
};

export const ViewRelationFieldFilter = ({
  field,
  filter,
}: ViewRelationFieldFilterProps) => {
  const workspace = useWorkspace();
  const view = useDatabaseView();
  const { updateFilter, removeFilter } = useViewFilter({
    viewId: view.id,
    filterId: filter.id,
  });

  const operator =
    relationFieldFilterOperators.find(
      (operator) => operator.value === filter.operator
    ) ?? relationFieldFilterOperators[0]!;

  const relationIds = (filter.value as string[]) ?? [];
  const relationsQuery = useLiveQuery(
    (q) => {
      if (relationIds.length === 0 || !field.databaseId) {
        return q
          .from({ records: workspace.collections.records })
          .where(({ records }) => eq(records.id, '')); // Return empty result
      }

      return q
        .from({ records: workspace.collections.records })
        .where(({ records }) => inArray(records.id, relationIds));
    },
    [workspace.userId, field.databaseId, relationIds]
  );

  const relations = relationsQuery.data;
  const hideInput = isOperatorWithoutValue(operator.value);

  if (!field.databaseId) {
    return null;
  }

  return (
    <Popover
      open={view.isFieldFilterOpened(filter.id)}
      onOpenChange={() => {
        if (view.isFieldFilterOpened(filter.id)) {
          view.closeFieldFilter(filter.id);
        } else {
          view.openFieldFilter(filter.id);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed text-xs text-muted-foreground"
        >
          {field.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-96 flex-col gap-2 p-2">
        <div className="flex flex-row items-center gap-3 text-sm">
          <div className="flex flex-row items-center gap-0.5 p-1">
            <FieldIcon type={field.type} className="size-4" />
            <p>{field.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex grow flex-row items-center gap-1 rounded-md p-1 font-semibold cursor-pointer hover:bg-accent">
                <p>{operator.label}</p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {relationFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value = isOperatorWithoutValue(operator.value)
                      ? []
                      : relationIds;

                    updateFilter({
                      ...filter,
                      operator: operator.value,
                      value: value,
                    });
                  }}
                >
                  {operator.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={removeFilter}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        {!hideInput && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-2">
                {relations.slice(0, 1).map((relation) => (
                  <RelationBadge key={relation.id} record={relation} />
                ))}
                {relations.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No records selected
                  </p>
                )}
                {relations.length > 1 && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs px-1 text-muted-foreground"
                  >
                    +{relations.length - 1}
                  </Badge>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
              {relations.length > 0 && (
                <div className="flex flex-col flex-wrap gap-2 p-2">
                  {relations.map((relation) => (
                    <div
                      key={relation.id}
                      className="flex w-full flex-row items-center gap-2"
                    >
                      <RelationBadge record={relation} />
                      <X
                        className="size-4 cursor-pointer"
                        onClick={() => {
                          const newRelations = relationIds.filter(
                            (id) => id !== relation.id
                          );

                          updateFilter({
                            ...filter,
                            value: newRelations,
                          });
                        }}
                      />
                    </div>
                  ))}
                  <Separator className="w-full my-2" />
                </div>
              )}
              <RecordSearch
                databaseId={field.databaseId}
                exclude={relationIds}
                onSelect={(record) => {
                  const newRelations = relationIds.includes(record.id)
                    ? relationIds.filter((id) => id !== record.id)
                    : [...relationIds, record.id];

                  updateFilter({
                    ...filter,
                    value: newRelations,
                  });
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </PopoverContent>
    </Popover>
  );
};
