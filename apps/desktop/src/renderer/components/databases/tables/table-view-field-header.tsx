import React from 'react';
import { cn } from '@/lib/utils';
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
import { ViewField } from '@/types/databases';

interface TableViewFieldHeaderProps {
  viewField: ViewField;
}

export const TableViewFieldHeader = ({
  viewField,
}: TableViewFieldHeaderProps) => {
  const view = useView();

  const canEditDatabase = true;
  const canEditView = true;

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const [, dragRef] = useDrag<ViewField>({
    type: 'table-field-header',
    item: viewField,
    canDrag: () => canEditView,
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
          right: canEditView,
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
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex h-8 w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm hover:bg-gray-50',
                dropMonitor.isOver && dropMonitor.canDrop
                  ? 'border-r-2 border-blue-300'
                  : 'border-r',
              )}
              ref={dragDropRef as any}
            >
              <FieldIcon type={viewField.field.type} className="size-4" />
              <p>{viewField.field.name}</p>
            </div>
          </PopoverTrigger>
          <PopoverContent className="ml-1 flex w-72 flex-col gap-1 p-2 text-sm">
            <FieldRenameInput field={viewField.field} />
            <Separator />
            {true && (
              <>
                <div
                  className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                  onClick={() => {
                    // eventBus.publish({
                    //   __typename: 'AddSortEvent',
                    //   field: viewField.field,
                    //   viewId: view.id,
                    //   direction: 'ASC',
                    // });
                  }}
                >
                  <ArrowDownAz className="size-4" />
                  <span>Sort ascending</span>
                </div>

                <div
                  className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100"
                  onClick={() => {
                    // eventBus.publish({
                    //   __typename: 'AddSortEvent',
                    //   field: viewField.field,
                    //   viewId: view.id,
                    //   direction: 'DESC',
                    // });
                  }}
                >
                  <ArrowDownZa className="size-4" />
                  <span>Sort descending</span>
                </div>
              </>
            )}
            <div className="flex cursor-pointer flex-row items-center gap-2 p-1 hover:bg-gray-100">
              <Filter className="size-4" />
              <span>Filter</span>
            </div>
            <Separator />
            {canEditView && (
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
            {canEditDatabase && (
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