import React from 'react';
import { cn } from '@/shared/lib/utils';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 're-resizable';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { Separator } from '@/renderer/components/ui/separator';
import { FieldDeleteDialog } from '@/renderer/components/databases/fields/field-delete-dialog';
import { FieldRenameInput } from '@/renderer/components/databases/fields/field-rename-input';
import { useView } from '@/renderer/contexts/view';
import { FieldIcon } from '@/renderer/components/databases/fields/field-icon';
import { ArrowDownAz, ArrowDownZa, EyeOff, Filter, Trash2 } from 'lucide-react';
import { ViewField } from '@/shared/types/databases';
import { useDatabase } from '@/renderer/contexts/database';
import { isFilterableField, isSortableField } from '@/shared/lib/databases';

interface TableViewFieldHeaderProps {
  viewField: ViewField;
}

export const TableViewFieldHeader = ({
  viewField,
}: TableViewFieldHeaderProps) => {
  const database = useDatabase();
  const view = useView();

  const [openPopover, setOpenPopover] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const [, dragRef] = useDrag<ViewField>({
    type: 'table-field-header',
    item: viewField,
    canDrag: () => database.canEdit,
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult<{ after: string }>();
      if (!dropResult?.after) return;

      view.moveField(viewField.field.id, dropResult.after);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [dropMonitor, dropRef] = useDrop({
    accept: 'table-field-header',
    drop: () => ({
      after: viewField.field.id,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const divRef = React.useRef<HTMLDivElement>(null);
  const dragDropRef = dragRef(dropRef(divRef));

  const canFilter = isFilterableField(viewField.field);
  const canSort = isSortableField(viewField.field);

  return (
    <React.Fragment>
      <Resizable
        defaultSize={{
          width: `${viewField.width}px`,
          height: '2rem',
        }}
        minWidth={100}
        maxWidth={500}
        size={{
          width: `${viewField.width}px`,
          height: '2rem',
        }}
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
          right: 'opacity-0 hover:opacity-100 bg-blue-300',
        }}
        handleStyles={{
          right: {
            width: '3px',
            right: '-3px',
          },
        }}
        onResizeStop={(_e, _direction, ref) => {
          const newWidth = ref.offsetWidth;
          view.resizeField(viewField.field.id, newWidth);
        }}
      >
        <Popover modal={true} open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50',
                dropMonitor.isOver && dropMonitor.canDrop
                  ? 'border-r-2 border-blue-300'
                  : 'border-r'
              )}
              ref={dragDropRef as React.LegacyRef<HTMLDivElement>}
            >
              <FieldIcon type={viewField.field.type} className="size-4" />
              <p>{viewField.field.name}</p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
            <FieldRenameInput field={viewField.field} />
            <Separator />
            {canSort && (
              <React.Fragment>
                <div
                  className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                  onClick={() => {
                    view.initFieldSort(viewField.field.id, 'asc');
                    setOpenPopover(false);
                  }}
                >
                  <ArrowDownAz className="size-4" />
                  <span>Sort ascending</span>
                </div>

                <div
                  className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                  onClick={() => {
                    view.initFieldSort(viewField.field.id, 'desc');
                    setOpenPopover(false);
                  }}
                >
                  <ArrowDownZa className="size-4" />
                  <span>Sort descending</span>
                </div>
              </React.Fragment>
            )}
            {canFilter && (
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  view.initFieldFilter(viewField.field.id);
                  setOpenPopover(false);
                }}
              >
                <Filter className="size-4" />
                <span>Filter</span>
              </div>
            )}
            <Separator />
            {database.canEdit && (
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  view.setFieldDisplay(viewField.field.id, false);
                }}
              >
                <EyeOff className="size-4" />
                <span>Hide in view</span>
              </div>
            )}
            {database.canEdit && (
              <div
                className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                onClick={() => {
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="size-4" />
                <span>Delete field</span>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </Resizable>
      {showDeleteDialog && (
        <FieldDeleteDialog
          id={viewField.field.id}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      )}
    </React.Fragment>
  );
};
