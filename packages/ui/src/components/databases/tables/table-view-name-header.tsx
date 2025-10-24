import { ArrowDownAz, ArrowDownZa, Filter, Type } from 'lucide-react';
import { Resizable } from 're-resizable';
import { Fragment, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';

import { SpecialId } from '@colanode/core';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database as appDatabase } from '@colanode/ui/data';
import { cn } from '@colanode/ui/lib/utils';

export const TableViewNameHeader = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useDatabaseView();

  const [openPopover, setOpenPopover] = useState(false);

  const [dropMonitor, dropRef] = useDrop({
    accept: 'table-field-header',
    drop: () => ({
      after: 'name',
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const divRef = useRef<HTMLDivElement>(null);
  const dropDivRef = dropRef(divRef);

  return (
    <Resizable
      defaultSize={{
        width: `${view.nameWidth}px`,
        height: '2rem',
      }}
      minWidth={300}
      maxWidth={500}
      size={{ width: `${view.nameWidth}px`, height: '2rem' }}
      enable={{
        bottom: false,
        bottomLeft: false,
        bottomRight: false,
        left: false,
        right: database.canEdit,
        top: false,
        topLeft: false,
        topRight: false,
      }}
      handleClasses={{
        right: 'opacity-0 hover:opacity-100 bg-blue-300 dark:bg-blue-900',
      }}
      handleStyles={{
        right: {
          width: '3px',
          right: '-3px',
        },
      }}
      onResizeStop={(_, __, ref) => {
        const newWidth = ref.offsetWidth;
        view.resizeName(newWidth);
      }}
    >
      <Popover modal={true} open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-accent',
              dropMonitor.isOver && dropMonitor.canDrop
                ? 'border-r-2 border-blue-300 dark:border-blue-900'
                : 'border-r'
            )}
            ref={dropDivRef as React.Ref<HTMLDivElement>}
          >
            <Type className="size-4" />
            <p>{database.nameField?.name ?? 'Name'}</p>
          </div>
        </PopoverTrigger>
        <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
          <div className="p-1">
            <SmartTextInput
              value={database.nameField?.name ?? 'Name'}
              readOnly={!database.canEdit}
              onChange={(newName) => {
                if (newName === database.nameField?.name) return;

                const nodes = appDatabase.workspace(workspace.userId).nodes;
                nodes.update(database.id, (draft) => {
                  if (draft.attributes.type !== 'database') {
                    return;
                  }

                  draft.attributes.nameField = {
                    ...draft.attributes.nameField,
                    name: newName,
                  };
                });
              }}
            />
          </div>
          <Separator />
          {database.canEdit && (
            <Fragment>
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-accent rounded-sm"
                onClick={() => {
                  view.initFieldSort(SpecialId.Name, 'asc');
                  setOpenPopover(false);
                }}
              >
                <ArrowDownAz className="size-4" />
                <span>Sort ascending</span>
              </div>

              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-accent rounded-sm"
                onClick={() => {
                  view.initFieldSort(SpecialId.Name, 'desc');
                  setOpenPopover(false);
                }}
              >
                <ArrowDownZa className="size-4" />
                <span>Sort descending</span>
              </div>
            </Fragment>
          )}
          <div
            className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-accent rounded-sm"
            onClick={() => {
              view.initFieldFilter(SpecialId.Name);
              setOpenPopover(false);
            }}
          >
            <Filter className="size-4" />
            <span>Filter</span>
          </div>
        </PopoverContent>
      </Popover>
    </Resizable>
  );
};
